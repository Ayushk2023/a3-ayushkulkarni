var passport = require('passport');
var OpenIDConnectStrategy = require('passport-openidconnect');

passport.use(new OpenIDConnectStrategy({
  issuer: 'https://' + process.env['AUTH0_DOMAIN'] + '/',
  authorizationURL: 'https://' + process.env['AUTH0_DOMAIN'] + '/authorize',
  tokenURL: 'https://' + process.env['AUTH0_DOMAIN'] + '/oauth/token',
  userInfoURL: 'https://' + process.env['AUTH0_DOMAIN'] + '/userinfo',
  clientID: process.env['AUTH0_CLIENT_ID'],
  clientSecret: process.env['AUTH0_CLIENT_SECRET'],
  callbackURL: 'http://localhost:3000/oauth2/redirect',
  scope: [ 'profile', 'email' ]
}, function verify(issuer, profile, cb) {
  return cb(null, profile);
}));

passport.serializeUser(function(user, cb) {
      cb(null, user);
  });
  
  passport.deserializeUser(function(user, cb) {
      return cb(null, user);
  });

var express = require('express');
var qs = require('querystring');
var router = express.Router();

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