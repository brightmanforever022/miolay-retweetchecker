require('dotenv').config()
var config
if (process.env.NODE_ENV === 'development') {
  config = require('../config/dev')
} else {
  config = require('../config/product')
}
const twitter = require('../lib/twitter')(config.twitter)

const isOutdated = record => {
  if (!record.updatedAt) return true
  if ((new Date(record.updatedAt)) <= (new Date(Date.now() - (config.cache.lifetimeSeconds * 1000)))) {
    return true
  }
  return false
}

const getOne = (type, model, check, apiMethod, apiMethodOptions) => {
  return model.find(check).then(result => {
    if (!result || result.length === 0 || isOutdated(result[0])) {
      return apiMethod(check, apiMethodOptions)
    } else {
      return Promise.resolve(result[0])
    }
  }).then(result => {
    if (!result._id) {
      return model.setFromApiResult(result)
    } else {
      return Promise.resolve(result)
    }
  }).then(result => {
    return result
  })
}

exports.getStatus = (req, res) => {
  if (!req.session.twitterUser) {
    req.session.twitterAccessTokenKey = config.twitter.oauth1.accessTokenKey
    req.session.twitterAccessTokenSecret = config.twitter.oauth1.accessTokenSecret
    twitter.setUser(config.twitter.oauth1.accessTokenKey, config.twitter.oauth1.accessTokenSecret)
  }
  getOne(
    'tweet',
    require('../models/retweets')(req.db),
    req.body.retweetId,
    req.twitter.getRetweets,
    { count: config.twitter.limits.retweets, tweet_mode: 'extended' }
  ).then(result => {
    res.json({
      type: 'tweet',
      data: result ? result : {}
    })
  }).catch(error => {
    console.error(error)
    res.status(500).json(error)
  })
}
