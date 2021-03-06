/*
    Node.js, express, oauth example using Twitters API

    Install Dependencies:
        npm install express
        npm install oauth

    Create App File:
        Save this file to app.js

    Start Server:
        node app.js

    Navigate to the page:
        Local host: http://127.0.0.1:8080
        Remote host: http://yourserver.com:8080

*/

var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var inspect = require('util-inspect');
var oauth = require('oauth');

var app = express();

const port = process.env.PORT || 8080;
const callbackUrl = "https://out-there-scraper.herokuapp.com/sessions/callback";
// Get your credentials here: https://dev.twitter.com/apps
var _twitterConsumerKey = process.env.TWITTER_CONSUMER_KEY;
var _twitterConsumerSecret = process.env.TWITTER_CONSUMER_SECRET;

var consumer = new oauth.OAuth(
    "https://twitter.com/oauth/request_token", "https://twitter.com/oauth/access_token",
    _twitterConsumerKey, _twitterConsumerSecret, "1.0A", callbackUrl, "HMAC-SHA1");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(logger({ path: "log/express.log"}));
app.use(cookieParser());
app.use(session({ secret: "very secret", resave: false, saveUninitialized: true}));

app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});

app.get('/sessions/connect', function(req, res){
  consumer.getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results){
    if (error) {
      res.send("Error getting OAuth request token : " + inspect(error), 500);
    } else {
      req.session.oauthRequestToken = oauthToken;
      req.session.oauthRequestTokenSecret = oauthTokenSecret;
      console.log("Double check on 2nd step");
      console.log("------------------------");
      console.log("<<"+req.session.oauthRequestToken);
      console.log("<<"+req.session.oauthRequestTokenSecret);
      res.redirect("https://twitter.com/oauth/authorize?oauth_token="+req.session.oauthRequestToken);
    }
  });
});

app.get('/sessions/callback', function(req, res){
  console.log("------------------------");
  console.log(">>"+req.session.oauthRequestToken);
  console.log(">>"+req.session.oauthRequestTokenSecret);
  console.log(">>"+req.query.oauth_verifier);
  consumer.getOAuthAccessToken(req.session.oauthRequestToken, req.session.oauthRequestTokenSecret, req.query.oauth_verifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
    if (error) {
      res.send("Error getting OAuth access token : " + inspect(error) + "[" + oauthAccessToken + "]" + "[" + oauthAccessTokenSecret + "]" + "[" + inspect(result) + "]", 500);
    } else {
      req.session.oauthAccessToken = oauthAccessToken;
      req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;

      res.redirect('/home');
    }
  });
});

app.get('/home', function(req, res){
    consumer.get("https://api.twitter.com/1.1/account/verify_credentials.json", req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, function (error, data, response) {
      if (error) {
        //console.log(error)
        res.redirect('/sessions/connect');
      } else {
        var parsedData = JSON.parse(data);
        console.log(parsedData);
        res.send('You are signed in: ' + inspect(parsedData.screen_name));
      }
    });
});

app.get('*', function(req, res){
    res.redirect('/home');
});

app.listen(port, function() {
  console.log(`App runinng on port ${port}!`);
});
