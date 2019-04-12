const sm = require('sitemap')
require('dotenv').config()
var config
if (process.env.NODE_ENV === 'development') {
  config = require('../config/dev')
} else {
  config = require('../config/product')
}
const originalUrl = config.originURL

exports.getSitemap = (req, res) => {
  console.log('arrive request to controller')
  var sitemap = sm.createSitemap ({
    hostname: originalUrl,
    cacheTime: 600000
  });
  const retweets = require('../models/retweets')(req.db)
  retweets.find({}, { tweet: 1 }).then(retweetList => {
    
    retweetList.map(retweet => {
      let retweetId = retweet.tweet.link.split('/status/').pop()
			let retweetUrl = '/status/' + retweetId
			sitemap.add({url: retweetUrl});
    })

    res.json({
      type: 'sitemap',
      data: sitemap.toString()
    })
  }).catch(error => {
    console.error(error)
    res.status(500).json(error)
  })
}
