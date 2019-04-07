var config
require('dotenv').config()
if (process.env.NODE_ENV === 'development') {
  config = require('../config/dev')
} else {
  config = require('../config/product')
}
const twitter = require('../lib/twitter')(config.twitter)

exports.login = (req, res) => {
  twitter.oauth1.init().then(result => {
    req.session.twitterRequestTokenKey = result.requestTokenKey
    req.session.twitterRequestTokenSecret = result.requestTokenSecret
    res.status(200).send({ session: req.session, redirect: result.authorizeUrl })
  }).catch(error => {
    console.error('twitter oauth initialization Error: ', error)
    res.status(500).send('Error initializing OAuth to Twitter')
  })
}

exports.loginCallback = (req, res) => {
  if (req.query.denied) {
    return
  }
  if (!req.query.oauth_verifier) {
    console.error('Error: no Oauth verifier in the authorization callback, here is what we got in query parameters: ' + JSON.stringify(req.query))
    res.status(500).send('Error authorizing user/application using Oauth through Twitter')
    return
  }
  twitter.oauth1.authorize(req.query.twitterRequestTokenKey, req.query.twitterRequestTokenSecret, req.query.oauth_verifier).then((result) => {
    req.session.twitterAccessTokenKey = result.accessTokenKey
    req.session.twitterAccessTokenSecret = result.accessTokenSecret
    return twitter.setUser(result.accessTokenKey, result.accessTokenSecret)
  }).then(result => {
    req.session.twitterUser = {
      screen_name: result.screen_name,
      avatar: result.profile_image_url
    }
    res.status(200).send(req.session)
  }).catch(error => {
    console.error('callback error: ', error)
    res.status(500).send('Error authorizing user/application using Oauth through Twitter')
  })
}

exports.logout = (req, res) => {
  req.session.twitterAccessTokenKey = config.twitter.oauth1.accessTokenKey
  req.session.twitterAccessTokenSecret = config.twitter.oauth1.accessTokenSecret
  req.session.twitterUser = null
  twitter.setUser(config.twitter.oauth1.accessTokenKey, config.twitter.oauth1.accessTokenSecret)
  res.send(req.session)
}
