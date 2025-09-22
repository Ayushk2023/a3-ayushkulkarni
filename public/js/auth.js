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
  scope: ['profile', 'email']
}, function verify(issuer, profile, cb) {
  return cb(null, profile);
}));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});
  
passport.deserializeUser(function(user, cb) {
  cb(null, user);
});

router.get('/login/auth0', passport.authenticate('openidconnect'));

router.get('/oauth2/redirect', passport.authenticate('openidconnect', {
  failureRedirect: '/login.html'
}), (request, response) => {
    request.session.username = request.user.displayName || request.user.emails?.[0]?.value;
    request.session.login = true
    response.redirect('/index.html')
});

router.get('/logout/auth0', (request, response) => {
    request.session = null
    response.redirect(
        `https://${process.env.AUTH0_DOMAIN}/v2/logout?` +
        qs.stringify({
          returnTo: 'http://localhost:3000/login.html',
          client_id: process.env.AUTH0_CLIENT_ID
        })
    )
})

module.exports = router;