const sm = require('sitemap')
var sitemap = sm.createSitemap ({
  hostname: 'http://127.0.0.1',
  cacheTime: 600000
});

exports.getSitemap = (req, res) => {
  const retweets = require('../models/retweets')(req.db)
  retweets.find({}, { tweet: 1 }).then(retweetList => {
    res.header('Content-Type', 'application/xml')
    
    retweetList.map(retweet => {
        console.log('retweet link: ', retweet.tweet.link)
    })

    res.send(result)
  }).catch(error => {
    console.error(error)
    res.status(500).json(error)
  })
}
  