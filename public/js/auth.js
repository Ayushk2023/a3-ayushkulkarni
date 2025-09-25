const passport = require('passport');
const OpenIDConnectStrategy = require('passport-openidconnect');
const express = require('express');
const qs = require('querystring');
const router = express.Router();

passport.use(new OpenIDConnectStrategy({
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  authorizationURL: `https://${process.env.AUTH0_DOMAIN}/authorize`,
  tokenURL: `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
  userInfoURL: `https://${process.env.AUTH0_DOMAIN}/userinfo`,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  callbackURL: `${process.env.BASE_URL}/oauth2/redirect`,
  scope: ['openid', 'profile', 'email']
}, function verify(issuer, profile, cb) {
  const json = profile._json || {};
  const user = {
    id: profile.id || json.sub,
    username: profile.nickname || json.nickname || json.name || json.login || json.email || json.sub,
    email: json.email,
    raw: profile
  };
  return cb(null, user);
}));

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (user, cb) {
  cb(null, user);
});

router.get('/login/auth0', passport.authenticate('openidconnect'));

router.get('/oauth2/redirect', passport.authenticate('openidconnect', {
  failureRedirect: '/login.html'
}), async (request, response) => {
  try {
    let username = request.user.username || request.user.email || request.user.id
    console.log(request.user.username)
    request.session.username = username
    request.session.login = true
    const usersCollection = request.app.locals.usersCollection;
    let user = await usersCollection.findOne({ username })
    let password = ""
    if (!user) {
      const result = await usersCollection.insertOne({ username, password })
      if (!username) {
        username = result.insertedId.toString();
      }
      user = { _id: result.insertedId, username, password }
      return response.send(`<script>alert("Account created for user ${username}"); window.location="/index.html";</script>`);
    }
    response.redirect('/index.html')
  } catch (err) {
    console.error("Error inserting Github user:", err)
    response.redirect('/login.html')
  }
});

router.get('/logout/auth0', (request, response) => {
  request.session.destroy(err => {
    if (err) {
      console.err("Logout Error", err)
    }
    response.redirect(
      `https://${process.env.AUTH0_DOMAIN}/v2/logout?` +
      qs.stringify({
        returnTo: `${process.env.BASE_URL}/login.html`,
        client_id: process.env.AUTH0_CLIENT_ID
      })
    )
  })
})

module.exports = router;