<p align="center"><img  width="150"src="/public/bottlecap.gif"/></p>

<h1 align="center">Pepsi-Petition</h1>
<br>

<h3> you can visit the live version of this project, hosted with Heroku at the link next to the repo description, or <a style="text-decoration: underline"href="https://hjec-petition.herokuapp.com/">here</a>.
Make David Drink Pepsi! 🥤</h3>
<p align="center"><img src="/public/gif/thanks.gif" width="80%" height="200%"/></p>
<h4 align="center">Overview demo of pepsi-petition</h4>

> “Get up, stand up, Stand up for your rights. Get up, stand up, Don't give up the fight.” ― Bob Marley

#### Author: [Henry Crookes](http:/github.com/hjec) :cowboy_hat_face:

##### contents:

1. [Description](#Description)
2. [Insights](#Insights)
3. [Technologies](#Technologies)
4. [Design Packages](#Design)
5. [Features](#Features)
   <br>[- create account](#1)
   <br>[- log in](#2)
   <br>[- edit information](#3)
   <br>[- form validation](#4)
   <br>[- add & delete signature](#5)
   <br>[- other signers](#6)
   <br>[- dynamic navigation](#7)

### Description:

This mock petition was my first experience creating a full stack application using Node.js and Express-Handlebars. The topic for my petition was to convince one of my teachers to stop drinking Coca-Cola<sup>TM</sup> and pick up Pepsi<sup>TM</sup> instead!
(No copyright infringement intended, this was purely a for-fun student project)

---

### Insights:

Up to this point I had experience purely in front-end coding and now it was time to jump into murky waters of back-end, and the world of servers and databases. I was really interested in the processes of handling user data and form validation, so this seemed like a great opportunity to get my head around industry standards for uploading, retrieving and displaying data.

### Technologies

-   HTML canvas
-   Cookie Session
-   express
-   helmet
-   Csurf
-   Bcrypt
-   handlebars.js
-   PostgreSQL
-   node.js
-   express-handlebars
-   Heroku

### Design Packages <a name="Design"></a>

-   Adobe Photoshop
-   screenToGif Editor

# Features:

#### 1. Create account <a name="1"></a>

<br>

<p align="center"><img src="/public/gif/create.gif" width="70%"/></p>

When first entering the site, users are prompted to enter some log-in details, and further information.
<strong>Bcrypt</strong> is used here to hash the password and then later compared for login.

A <strong>session cookie</strong> is then stored. Depending on which stage of the petition signing they have gone through, the <strong>handlebars templates</strong> will be rendered differently according to which cookies they have been assigned.

#### 2. log-in <a name="2"></a>

<br>

<p align="center"><img src="/public/gif/login.gif" width="70%"/></p>

Utilising the power of handlebars templating, I generated different templates containing partials of code to contain forms for data entry. Here the user can log back in to their account using the email and password they provided in step-1. <strong>If they have provided extra information</strong> such as age, city, location, website they will be rerouted to the information editing page. If not, then the edit page will look like it did after signing up.

#### 3. edit-information <a name="3"></a>

<br>

<p align="center"><img src="/public/gif/edit.gif" width="70%"/></p>

Users have the option to update or remove any of the information they have provided, including email and passwords. Once the form is submitted, if successful a message will appear notifying the user of a completed update, if they provide invalid data (such as characters for a field expecting integer) or an error occurs on update, they will recieve an error message instead.

#### 4. form validation <a name="4"></a>

<p align="center"><img src="/public/gif/wrong_register.gif" width="70%"/></p>

During registration, two seperate checks are made to ensure the submitted data is valid. First a check is made to ensure that the email account has not already been used. If this happens, a handlebars partial will appear informing the user that they must log-in or use a different email.

The user must also provide valid data in all of the fields, enforced by the <strong>"NOT NULL" constraint</strong> on the SQL database columns, and to check that the value isn't filled with whitespace. A separate error message will also appear in this instance.

<p align="center"><img src="/public/gif/wrong_login.gif" width="70%"/></p>

The log-in system is also set up to detect error codes sent from the <strong>PostgreSQL queries</strong>, depending on whether the email account doesn't exist, or if the password is wrong.

#### 5. add & delete signature <a name="5"></a>

<br>

<p align="center"><img src="/public/gif/save_sig.gif" width="70%"/></p>

What is the fundamental part of any petition you might wonder? Well, it's the signature of course, and this site is no different! Using the power of HTML canvas, I capture the path of the user's mouse location after clicking on the signature pad, and following the mouse movement. After the Mouseup event is triggered, the canvas image data is then encoded using the <strong>toDataURL() method</strong>, and then saved to a hidden input field inside a form which will be submitted once the button is clicked.

A privacy option is also included to stop a signature from appearing on the signers list. They must click the checkbox to have their signature appear. To achieve this I had to create 2 input fields with the same name. The hidden input field has a default value that adds a "non consenting" value to the form on submission. The server then detects if a consent value is true and updates the signatures database accordingly

<p align="center"><img src="/public/gif/delete_sig.gif" width="70%"/></p>

Users also have the option to remove their signature from their account. Once submitted, the page will be updated to display a message notifying of the change. The navbar will now also show a button to allow the user to sign the petition again.

#### 6. other signers <a name="6"></a>

<br>
<p align="center"><img src="/public/gif/signers.gif" width="70%"/></p>

After signing the petition, a navigation button will be available to view the names of the other people who signed the petition. These are arranged chronologically from the time they signed. The server sends an object containing information of all the rows from the signature table where the value for <strong>consent is true</strong> when the page is loading. Utilising handlebars logic, this view template will render the name, age and location city of the signers.

If a user has provided a city location, the text will act as a link to then direct the user to the same template view, but where a "result" conditional is true, so they can see all other signers from the same city location.

If a website was also provided, the signers name will act as a link to the webpage they provided. When they are given the opportunity to provide a link, some formatting is done to assure that a valid link is entered into the table. For starters, to make the name a responsive \<a> tag the server will run an external function on the provided website string to format to ensure there is a valid URI scheme in place. This is achieved simply:

```
function(url) {
    if (url.includes("http://") || url.includes("https://") || url === "") {
        return url;
    } else {
        return (url = "http://" + url);
    }
};
```

If everything works, then the user should be correctly forwarded off the petition site to see that signers personal page.

#### 7. dynamic navigation<a name="7"></a>

One small touch that I was personally proud of was that you will notice throughout using the site that the buttons in the navbar will change depending on the status of the users progress throughout signing the petition.
This was all achieved through the logic of handlebars templating, and some server side trickery by allocating the user different session cookies at different points, and then by tracking these the server will save a value in the <strong>response.locals object</strong>.

The handlebars view responsible for the navigation bar has a conditional inside the class of each button checking to see if the res.locals value matches their own, and if so, the class will change to "current_class" giving the button a different look to indicate to the user that they are on that specific page.

A simple, but important touch.

---

<h6>Thank you for looking through my project.</h6>
I hope you found something that interested you. I had a lot of fun discovering the different applications and potential for Express-handlebars and I hope this reflects well in my description. Please feel free to look at my other projects.
