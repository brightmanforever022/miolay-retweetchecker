'use strict';

var config;
if (process.env.NODE_ENV=='development') {
    config = require('../config/dev');
} else {
    config = require('../config/product');
}

const user = function (db) {

  const _this             = this;

  this.name             = null;
  this.screenName       = null;
  this.profileImageUrl  = null;
  this.tweets           = null;
  this.link             = null;
  this.realProbability  = 0;
  this.probabilityMatrix    = {
    // The safe zone that the overall count is compared to in order to determine a binary "Real" or "Fake" metric
    fakeThreshold           : config.fakeThreshold,
    maxPoints               : 0, // max number of points available
    total                   : 0,
    retweetRatio            : 0,
    followedBy              : 0,
    isFollowing             : 0,
    followerRatio           : 0,
    retweetCount            : 0,
    replyCount              : 0,
    overall                 : 0,
    isReal                  : false,
    isBlacklisted           : false,
    isWhitelisted           : false,
    points                  : []
  };
  this.retweeters = [];
  
  this.find = ( screenName ) => {
    return db.find('users', { _id: screenName.toLowerCase() });
  };

  this.save = () => {
    return db.save('users', _this.get());
  };

  this.get = () => {
    return {
      _id: _this.screenName.toLowerCase(),
      tweet: _this.tweet.get(),
      profileImageUrl: _this.profileImageUrl,
      link: _this.link,
      realProbability: _this.realProbability,
      probabilityMatrix: _this.probabilityMatrix,
      retweetId: _this.retweetId,
      retweeters: _this.retweeters,
      updatedAt: (new Date())
    };
  };

  this.setFromApiResult = ( userTimeline ) => {

    if (userTimeline.length === 0) return;
    _this.tweets                  = userTimeline;
    _this.tweet                   = require('./tweet')(db);
    _this.tweet.setFromApiResult(userTimeline[0]);
    _this.profileImageUrl         = userTimeline[0].user.profile_image_url;
    _this.name                    = userTimeline[0].user.name;
    _this.screenName              = userTimeline[0].user.screen_name;
    _this.link                    = 'https://twitter.com/' + userTimeline[0].user.screen_name;
    _this.retweeters              = [];
    _this.calculateRealProbability();
    _this.generateProbabilityMatrix();
    _this.analyzeRetweeter();
    // return _this.save();
    return _this;
  };

  this.setUserResult = (result, statusResult, userRetweeters, retweetId) => {

    if (!statusResult) return;
    _this.tweets                  = result;
    _this.tweet                   = require('./tweet')(db);
    _this.tweet.setFromApiResult(statusResult);
    _this.profileImageUrl         = statusResult.user.profile_image_url;
    _this.name                    = statusResult.user.name;
    _this.screenName              = statusResult.user.screen_name;
    _this.link                    = 'https://twitter.com/' + statusResult.user.screen_name;
    _this.retweetId               = retweetId;
    _this.retweeters              = userRetweeters;
    _this.calculateRealProbability();
    _this.generateProbabilityMatrix();
    _this.analyzeRetweeter();
    return _this.save();
  };

  this.userListContains = (type, screenName) => {
    const list = config.users[type];
    for (let i in list) {
      if (list[i].toLowerCase() === screenName.toLowerCase()) {
        return true;
      }
    }
    return false;
  };

  this.calculateRealProbability = () => {
    const total       = _this.tweets.length;
    let retweeted     = 0;
    for (let i in _this.tweets) {
      if (_this.tweets[i].retweeted_status && _this.tweets[i].retweeted_status.id) {
        retweeted++;
      }
    }
    if (_this.userListContains('whitelist', _this.screenName)) {
      _this.realProbability = 100;
      return;
    }
    if (_this.userListContains('blacklist', _this.screenName)) {
      _this.realProbability = 0;
      return;
    }
    if (_this.profileImageUrl.indexOf('default_profile_images/default_profile') === -1 && (retweeted/total) < 0.5) {
      _this.realProbability = 100;
    }
  };

  this.generateProbabilityMatrix = () => {
    _this.probabilityMatrix.total = _this.tweets.length;
    _this.probabilityMatrix.processed = false;
    for (let i in _this.tweets) {
      if (_this.tweets[i].retweeted_status && _this.tweets[i].retweeted_status.id) _this.probabilityMatrix.retweetCount++;
      if (_this.tweets[i].in_reply_to_status_id !== null) _this.probabilityMatrix.replyCount++;
    }

    _this.probabilityMatrix.retweetRatio = Math.round((_this.probabilityMatrix.retweetCount / _this.probabilityMatrix.total) * 100);

    
    const ranges = [{
        msg: 'More than 99% are retweets of others',
        operations: [['gte', 99]],
        points: 40
      },
      {
        msg: 'More than 95% are retweets of others',
        operations: [['gte', 95], ['lte', 98]],
        points: 10
      }];

    _this.probabilityMatrix.maxPoints += ranges[0].points;
    _this.probabilityMatrix.maxPoints += ranges[1].points;

    for (let i in ranges) {
      let falseFound = false;
      for (let o in ranges[i].operations) {
        switch (ranges[i].operations[o][0]){
          case 'gte': if(!(_this.probabilityMatrix.retweetRatio >= ranges[i].operations[o][1])) falseFound = true;
            break;
          case 'lte': if(!(_this.probabilityMatrix.retweetRatio <= ranges[i].operations[o][1])) falseFound = true;
            break;
        }
      }

      if(!falseFound) {
        _this._addPoints(ranges[i].points, ranges[i].msg, 'activity');
      }
    }

    if(_this.probabilityMatrix.replyCount === 0) _this._addPoints(10, 'No tweet replies found for this user', 'activity');
    _this.probabilityMatrix.maxPoints += 10;


    _this.probabilityMatrix.followedBy = _this.tweets[0].user.followers_count;
    _this.probabilityMatrix.isFollowing = _this.tweets[0].user.friends_count;

    _this.probabilityMatrix.followerRatio = Math.round((_this.probabilityMatrix.isFollowing / _this.probabilityMatrix.followedBy) * 100 );
    if (_this.probabilityMatrix.followerRatio < 200) {
      _this.probabilityMatrix.followerRatio = 200;
    }
    
    if(_this.probabilityMatrix.isFollowing === 0) _this._addPoints(30, 'This user is not following any other users', 'account');
    _this.probabilityMatrix.maxPoints += 30;

    if(_this.probabilityMatrix.followedBy === 0) _this._addPoints(30, 'This user is not followed by any other users', 'account');
    _this.probabilityMatrix.maxPoints += 30;

    if (_this.profileImageUrl.indexOf('default_profile_images/default_profile') >= 0) {
      _this._addPoints(30, 'User is using default profile image', 'account');
    }
    _this.probabilityMatrix.maxPoints += 30;

    if (_this.userListContains('blacklist', _this.screenName)) {
      _this._addPoints(100, 'This user is in the blacklist', 'account');
      _this.probabilityMatrix.isBlacklisted = true;
    }
    _this.probabilityMatrix.maxPoints += 100;

    if (_this.userListContains('whitelist', _this.screenName)) {
      _this.probabilityMatrix.points = [];
      _this.probabilityMatrix.overall = 0;
      _this.probabilityMatrix.isWhitelisted = true;
    }

    // Calculate isReal
    _this.probabilityMatrix.isReal = _this.probabilityMatrix.overall <= config.fakeThreshold;
    _this.probabilityMatrix.processed = true;
  };

  _this.analyzeRetweeter = () => {
    // Check if isReal
    const rtAnalysis = {
      classification : null, // [real, suspicious, bots]
      justification: null,
    };

    if(_this.probabilityMatrix.processed){
      const suspiciousThreshold = 30;
      const botThreshold = 60;
      const influencerThreshold = 2000;
      const massRetweetRatioThreshold = 90; // %
      const massFollowerRatioThreshold = 1200; // %

      // Check if user is a bot
      if(_this.probabilityMatrix.overall >= botThreshold){
        let accountScore = 0;
        let activityScore = 0;

        _this.probabilityMatrix.points.map((item) => {
          if(item.type === 'account') accountScore += item.points;
          if(item.type === 'activity') activityScore += item.points;
        });

        switch (true){
          case accountScore > 0 && activityScore > 9:
            rtAnalysis.classification = 'bots';
            rtAnalysis.justification = {
              reason: `Unusually high combined account (${accountScore}) and account activity (${activityScore}) threat score`,
              slug: 'accountAndActivity',
            };
            break;
          case accountScore > 0 && activityScore === 0:
            rtAnalysis.classification = 'bots';
            rtAnalysis.justification = {
              reason: `Unusually high account (${accountScore}) threat score`,
              slug: 'account',
            };
            break;
          case activityScore > 0 && accountScore === 0:
            rtAnalysis.classification = 'bots';
            rtAnalysis.justification = {
              reason: `Unusually high account activity (${activityScore}) threat score`,
              slug: 'activity',
            };
            break;
        }

      } else {
        let isSuspicious = false;
        if(_this.probabilityMatrix.retweetRatio >= massRetweetRatioThreshold) { // more than 60% of tweets are retweets
          isSuspicious = true;
          rtAnalysis.classification = 'suspicious';
          rtAnalysis.justification = {
            reason: `Retweet percentage is beyond threshold (${massRetweetRatioThreshold}%)`,
            slug: 'highRetweetRatio'
          };
        }

        if(_this.probabilityMatrix.followerRatio >= massFollowerRatioThreshold && !isSuspicious) { // within specified range
          isSuspicious = true;
          rtAnalysis.classification = 'suspicious';
          rtAnalysis.justification = {
            reason: `Follower to followed by ratio is beyond threshold (${massFollowerRatioThreshold}%)`,
            slug: 'highFollowerRatio'
          };
        }

        if(!isSuspicious){
          if(_this.probabilityMatrix.overall <= suspiciousThreshold){
            if(_this.probabilityMatrix.followedBy >= influencerThreshold){
              rtAnalysis.classification = 'real';
              rtAnalysis.justification = {
                reason: `User has follower count beyond threshold (${influencerThreshold})`,
                slug: 'influencer'
              };
            }  else {
              rtAnalysis.classification = 'real';
              rtAnalysis.justification = {
                reason: `User has follower count shy of threshold (${influencerThreshold})`,
                slug: 'regular'
              };
            }
          } else {
            rtAnalysis.classification = 'suspicious';
            rtAnalysis.justification = {
              reason: `Overall threat level is over 'suspicious' threshold (${suspiciousThreshold})`,
              slug: 'highThreatLevel'
            };
          }
        }
      }
      _this.probabilityMatrix.analysis = rtAnalysis;
    }
  };

  this._addPoints = (points, msg, type) => {
    _this.probabilityMatrix.points.push({
      points: points,
      message : msg,
      type: type || 'misc'
    });
    _this.probabilityMatrix.overall += points;
  };

};

module.exports = db => {
  return new user(db);
};
