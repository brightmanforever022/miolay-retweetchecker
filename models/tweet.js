'use strict'

const dateformat = require('dateformat')

const tweet = function (db) {

  const _this = this

  this.id       = null
  this.content  = null
  this.date     = null
  this.link     = null
  this.user     = {
    name: null,
    screenName: null,
    profileImageUrl: null,
    link: null
  }

  this.counts   = {
    retweets: 0,
    likes: 0
  }

  this.get = () => {
    return {
      id: _this.id,
      link: _this.link,
      user: _this.user,
      content: _this.content,
      date: _this.date,
      counts: _this.counts
    }
  }

  this.setFromApiResult = tweet => {
    _this.id                    = tweet.id_str
    _this.content               = tweet.full_text || tweet.text
    _this.date                  = dateformat(new Date(tweet.created_at), 'm/d/yy')
    _this.counts.retweets       = tweet.retweet_count
    _this.counts.likes          = tweet.favorite_count
    _this.user.name             = tweet.user.name
    _this.user.screenName       = tweet.user.screen_name
    _this.user.profileImageUrl  = tweet.user.profile_image_url
    _this.user.link             = 'https://twitter.com/' + tweet.user.screen_name
    _this.link                  = 'https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str
    _this.retweeters            = []
  }

}

module.exports = db => {
  return new tweet(db)
}
