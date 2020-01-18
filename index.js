const express = require("express"),
  app = express(),
  hb = require("express-handlebars"),
  router = require("./auth");
//URL//
const url = require("url");
const querystring = require("querystring");
//security //
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const helmet = require("helmet");
const { compare, hashPass } = require("./bcrypt");
let secrets;
if (process.env.NODE_ENV === "production") {
  secrets = process.env;
} else {
  secrets = require("./secrets.json");
}
//__security__//

//functions//
const {
  addProfile,
  getProfileData,
  addSigners,
  checkHttp,
  capitalizeFirstLetter,
  capitalizeCityNames,
  userSig,
  deleteSig,
  getSigners,
  getSignersByCity,
  updateUser,
  updateUserPassword,
  upsertProfile
} = require("./extFunctions");

const {
  noUserId,
  requireProfileId,
  hasProfileId,
  requireSignature,
  requireNoSignature
} = require("./middleware");
//__functions__//
app.use(helmet());
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(express.static("./public"));
app.use(
  express.urlencoded({
    extended: false
  })
);

app.use(
  cookieSession({
    secret: secrets.SESSION_SECRET,
    maxAge: 1000 * 60 * 60 * 24 * 14
  })
);

app.use(csurf()); // CSURF middleware to look for valid secret TOKEN. This adds CSRF Token to request object.

app.use(function(req, res, next) {
  res.set("x-frame-options", "DENY"); // set headers to stop clickjacking with iframe windows
  res.locals.csrfToken = req.csrfToken();
  // console.log("userid:", req.session.userId);
  // console.log("profile id:", req.session.profileId);
  // console.log("signature id:", req.session.signatureId);
  res.locals.url = req.url;
  res.locals.count = req.session.count;
  console.log("count signatures: ", res.locals.count);

  if (req.url === "/profile") {
    res.locals.profile = true;
  }
  if (req.url === "/edit") {
    res.locals.edit = true;
  }
  if (req.url === "/petition") {
    res.locals.petition = true;
  }
  if (req.url === "/thanks") {
    res.locals.thanks = true;
  }
  next();
});

app.use(router);

// Profile Page Routes //
app.get("/profile", noUserId, hasProfileId, (req, res) =>
  res.render("profile")
);

app.post("/profile", noUserId, hasProfileId, (req, res) => {
  let age = req.body.age;
  if (age === "") {
    age = null;
  }
  let city = capitalizeCityNames(req.body.city);
  let homepage = checkHttp(req.body.homepage);

  let user_id = req.session.userId;

  addProfile(age, city, homepage, user_id)
    .then(returnId => {
      req.session.profileId = returnId.rows[0].user_id;
      console.log("profileId: ", req.session.profileId);
    })
    .then(() => {
      res.redirect("/petition");
    })
    .catch(err => {
      console.log("Error in profile submission: ", err);
      res.render("profile", { err });
    });
});

// Edit Page Routes //
app.get("/edit", requireProfileId, (req, res) => {
  let id = req.session.userId;

  let parsedUrl = url.parse(req.url);
  let updated = querystring.parse(parsedUrl.query);

  //checking url for "updated" query string to fire hndlbrs-cndtnl with same name
  if (updated.updated) {
    getProfileData(id).then(data => {
      if (data[0].signature) {
        let signature = data[0].signature;
        res.render("edit", { updated, data, signature });
      } else {
        res.render("edit", { updated, data });
      }
    });
  } else {
    getProfileData(id).then(data => {
      if (data[0].signature) {
        let signature = data[0].signature;
        res.render("edit", { data, signature });
      } else {
        res.render("edit", { data });
      }
    });
  }
});

app.post("/edit", requireProfileId, (req, res) => {
  let first = capitalizeFirstLetter(req.body.first.toLowerCase()),
    last = capitalizeFirstLetter(req.body.last.toLowerCase()),
    age = req.body.age,
    city = capitalizeCityNames(req.body.city),
    email = req.body.email,
    password = req.body.password,
    homepage = checkHttp(req.body.homepage),
    id = req.session.userId;

  if (age === "") {
    age = null;
  }

  Promise.all([
    updateUser(first, last, email, id),
    updateUserPassword(password, id),
    upsertProfile(age, city, homepage, id)
  ])
    .then(() => {
      res.redirect("/edit/?updated=true");
    })
    .catch(err => {
      console.log("Error in edit page: ", err);
      getProfileData(id).then(data => {
        res.render("edit", { err, data });
      });
    });
});

app.post("/signature/delete", (req, res) => {
  deleteSig(req.session.userId).then(() => {
    delete req.session.signatureId;
    res.redirect("/edit/?updated=true");
  });
});

// Petition Routes //
app.get("/petition", noUserId, requireNoSignature, (req, res) => {
  console.log("GET request reaches petition");
  res.render("petition");
});

app.post("/petition", noUserId, requireNoSignature, (req, res) => {
  let sig = req.body.sig;
  let user_id = req.session.userId;
  let date = new Date();
  let timeStamp = `${date.getFullYear()} - ${date.getMonth() +
    1} -  ${date.getDate()}`;
  //
  let consent;
  if (req.body.consent[1] === "clicked") {
    consent = req.body.consent[1];
  } else {
    consent = req.body.consent;
  }

  addSigners(sig, timeStamp, consent, user_id)
    .then(returnId => {
      req.session.signatureId = req.session.userId;
      console.log("Id of new signature: ", req.session.signatureId); // using userId cookie to donate signatureId cookie, allowing effective routing
    })
    .then(() => {
      res.redirect("/thanks");
    })
    .catch(err => {
      if (err.code === "215") {
        console.log("non unique id ", err);
        res.redirect("/thanks");
      } else {
        console.log("Error in petition post: ", err);
        res.render("petition", {
          err
        });
      }
    });
});

// Thank You Page Routes //
app.get("/thanks", requireSignature, (req, res) => {
  let id = req.session.userId;

  userSig(id)
    .then(result => {
      let sig = result[0].signature,
        first = result[0].first;

      getSigners().then(data => {
        let count = data.length;
        req.session.count = count;
        res.render("thanks", { sig, first, count });
      });
    })
    .catch(err => {
      "Error in displaying signature: ", err;
    });
});

app.post("/thanks", requireSignature, (req, res) => {
  res.redirect("/signers");
});

// Signers Page Routes //
app.get("/signers", requireSignature, (req, res) => {
  getSigners()
    .then(data => {
      res.render("signers", {
        data
      });
    })
    .catch(err => {
      console.log("error in Thanks post: ", err);
    });
});

app.get("/signers/:city", requireSignature, (req, res) => {
  getSignersByCity(req.params.city)
    .then(result => {
      res.render("signers", { result });
    })
    .catch(err => {
      console.log("error in signers by city: ", err);
    });
});

if (require.main == module) {
  //app.listen goes in here when someone requires node index.js
  //main module is a way of identifying if this file is the main file
}

app.listen(process.env.PORT || 8080, () =>
  console.log("Petition server is listening")
);
