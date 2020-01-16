// middleware function to send user without userId token to register page
exports.requireLoggedOutUser = function(req, res, next) {
    if (req.session.userId) {
        res.redirect("/petition");
    } else {
        next();
    }
};

exports.noUserId = function(req, res, next) {
    if (!req.session.userId) {
        res.redirect("/login");
    } else {
        next();
    }
};

// middleware function to send user without signature token to petition page to sign form.
exports.requireSignature = function(req, res, next) {
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else {
        next();
    }
};

//middleware function that allows users who do have signature token to see thank you page.
exports.requireNoSignature = function(req, res, next) {
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        next();
    }
};

exports.requireProfileId = function(req, res, next) {
    if (!req.session.profileId) {
        res.redirect("/profile");
    } else {
        next();
    }
};

exports.hasProfileId = function(req, res, next) {
    if (req.session.profileId) {
        res.redirect("/petition");
    } else {
        next();
    }
};
