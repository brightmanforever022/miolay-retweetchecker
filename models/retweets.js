'use strict'

var config
if (process.env.NODE_ENV=='development') {
    config = require('../config/dev')
} else {
    config = require('../config/product')
}

const retweets = function (db) {

  const _this     = this

  this.idPrefix       = 'retweets_'

  this.id             = null
  this.tweet          = null
  this.retweeters     = []
  this.realCount      = 0
  this.searchTerm     = ''
  this.numberofRetweetAndFavorite = 0

  this.find = id => {
    return db.find('retweets', { searchTerm: _this.idPrefix + id })
  }

  this.getTweetList = () => {
    return db.findOnly('retweets', {}, { tweet: 1 })
  }

  this.save = () => {
    let retweetFromAPI = _this.get()
    return db.find('retweets', { searchTerm: retweetFromAPI.searchTerm}).then(retweetList => {
      if (retweetList.length > 0) {
        return _this.update(retweetFromAPI)
      } else {
        return db.save('retweets', retweetFromAPI)
      }
    }).catch(err => {
      return db.save('retweets', retweetFromAPI)
    })
  }

  this.update = (row) => {
    return db.update('retweets', {searchTerm: row.searchTerm}, {
      tweet: row.tweet,
      retweeters: row.retweeters,
      updatedAt: (new Date()),
      realCount: row.realCount,
      searchTerm: row.searchTerm,
      numberofRetweetAndFavorite: row.numberofRetweetAndFavorite
    })
  }
  this.get = () => {
    return {
      // _id: _this.id,
      tweet: _this.tweet.get(),
      retweeters: _this.retweeters,
      updatedAt: (new Date()),
      realCount: _this.realCount,
      searchTerm: _this.id,
      numberofRetweetAndFavorite: _this.numberofRetweetAndFavorite
    }
  }

  this.setFromApiResult = (retweets) => {
    if (retweets.length === 0) return

    _this.tweet = require('./tweet')(db)
    _this.tweet.setFromApiResult(retweets[0].retweeted_status)
    _this.id    = _this.idPrefix + _this.tweet.id
    for (let i in retweets) {
      if(retweets[i].user.isReal) _this.realCount ++
      _this.retweeters.push({
        screenName: retweets[i].user.screen_name,
        profileImageUrl: retweets[i].user.profile_image_url,
        isReal: retweets[i].user.isReal,
        analysis: []
      })
    }
    return _this.save()
  }

  
  this.userListContains = (type, screenName) => {
    const list = config.users[type]
    for (let i in list) {
      if (list[i].toLowerCase() === screenName.toLowerCase()) {
        return true
      }
    }
    return false
  }
  
  this.getAnalysis = (currentRetweet, retweets) => {
    const totalLength = currentRetweet.user.statuses_count
    const followedBy = currentRetweet.user.followers_count
    let retweetCount = 0, replyCount = 0, retweetRatio = 0, overall = 0, followerRatio = 0
    let accountScore = 0, activityScore = 0
    const ranges = [
      {
        msg: 'More than 99% are retweets of others',
        operations: [['gte', 99]],
        points: 40
      },
      {
        msg: 'More than 95% are retweets of others',
        operations: [['gte', 95], ['lte', 98]],
        points: 10
      }
    ]
    const rtAnalysis = {
      classification : null, // [real, suspicious, bots]
      justification: null,
    }
    const suspiciousThreshold = 30
    const botThreshold = 60
    const influencerThreshold = 2000
    const massRetweetRatioThreshold = 90 // %
    const massFollowerRatioThreshold = 1200 // %
    
    for (let i in retweets) {
      if (retweets[i].retweeted_status && retweets[i].retweeted_status.id) retweetCount++
      if (retweets[i].in_reply_to_status_id !== null) replyCount++
    }
    // followedBy = currentRetweet.retweeted_status.user.followers_count

    retweetRatio = Math.round((retweetCount / totalLength) * 100)
    
    // console.log(currentRetweet.user.screen_name + ': ' + retweetRatio)
    for (let i in ranges) {
      let falseFound = false
      for (let o in ranges[i].operations) {
        switch (ranges[i].operations[o][0]){
          case 'gte': if(!(retweetRatio >= ranges[i].operations[o][1])) falseFound = true
          break
          case 'lte': if(!(retweetRatio <= ranges[i].operations[o][1])) falseFound = true
          break
        }
      }
      
      if(!falseFound) {
        overall += ranges[i].points
        activityScore += ranges[i].points
      }
    }
    
    if(replyCount === 0) {
      overall += 10
      activityScore += 10
    }
    followerRatio = Math.round((currentRetweet.user.friends_count / currentRetweet.user.followedBy) * 100 )
    if(currentRetweet.user.friends_count === 0) {
      overall += 30
      accountScore += 30
    }
    if(currentRetweet.user.followers_count === 0) {
      overall += 30
      accountScore += 30
    }
    // console.log('current retweet: ', currentRetweet)
    if (currentRetweet.user.profile_image_url.indexOf('default_profile_images/default_profile') >= 0) {
      overall += 30
      accountScore += 30
    }
    if (_this.userListContains('blacklist', currentRetweet.user.screen_name)) {
      overall += 100
      accountScore += 100
    }
    if (_this.userListContains('whitelist', currentRetweet.user.screen_name)) {
      overall = 0
    }
    if(overall >= botThreshold){
      switch (true) {
        case accountScore > 0 && activityScore > 9:
          rtAnalysis.classification = 'bots'
          rtAnalysis.justification = {
            reason: `Unusually high combined account (${accountScore}) and account activity (${activityScore}) threat score`,
            slug: 'accountAndActivity',
          }
          break
        case accountScore > 0 && activityScore === 0:
          rtAnalysis.classification = 'bots'
          rtAnalysis.justification = {
            reason: `Unusually high account (${accountScore}) threat score`,
            slug: 'account',
          }
          break
        case activityScore > 0 && accountScore === 0:
          rtAnalysis.classification = 'bots'
          rtAnalysis.justification = {
            reason: `Unusually high account activity (${activityScore}) threat score`,
            slug: 'activity',
          }
          break
      }
      
    } else {
      let isSuspicious = false
      if(retweetRatio >= massRetweetRatioThreshold) { // more than 60% of tweets are retweets
        isSuspicious = true
        rtAnalysis.classification = 'suspicious'
        rtAnalysis.justification = {
          reason: `Retweet percentage is beyond threshold (${massRetweetRatioThreshold}%)`,
          slug: 'highRetweetRatio'
        }
      }
      
      if(followerRatio >= massFollowerRatioThreshold && !isSuspicious) { // within specified range
        isSuspicious = true
        rtAnalysis.classification = 'suspicious'
        rtAnalysis.justification = {
          reason: `Follower to followed by ratio is beyond threshold (${massFollowerRatioThreshold}%)`,
          slug: 'highFollowerRatio'
        }
      }
      
      if(!isSuspicious){
        if(overall <= suspiciousThreshold){
          if(followedBy >= influencerThreshold){
            rtAnalysis.classification = 'real'
            rtAnalysis.justification = {
              reason: `User has follower count beyond threshold (${influencerThreshold})`,
              slug: 'influencer'
            }
          }  else {
            rtAnalysis.classification = 'real'
            rtAnalysis.justification = {
              reason: `User has follower count shy of threshold (${influencerThreshold})`,
              slug: 'regular'
            }
          }
        } else {
          rtAnalysis.classification = 'suspicious'
          rtAnalysis.justification = {
            reason: `Overall threat level is over 'suspicious' threshold (${suspiciousThreshold})`,
            slug: 'highThreatLevel'
          }
        }
      }
    }
    return rtAnalysis
    
  }
}
  
module.exports = db => {
  return new retweets(db)
}
