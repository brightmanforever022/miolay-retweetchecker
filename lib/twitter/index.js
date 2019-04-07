'use strict';

const Promise     = require('bluebird');
const Twit        = require('twit');

const twitter = function (configure) {
  var _this       = this;
  this.config     = configure;
  const tokenKey = configure.oauth1.accessTokenKey;
  const tokenSecret = configure.oauth1.accessTokenSecret;
  // this.oauth1     = null;
  this.user       = {
    "accessTokenKey": tokenKey,
    "accessTokenSecret": tokenSecret,
    data: null
  };

  this.getApi = () => {
    return new Twit({
      consumer_key: _this.config.oauth1.consumerKey,
      consumer_secret: _this.config.oauth1.consumerSecret,
      access_token: _this.user.accessTokenKey,
      access_token_secret: _this.user.accessTokenSecret
    });
  };

  this.setUser = (accessTokenKey, accessTokenSecret, userData) => {
    if (!accessTokenKey || !accessTokenSecret) {
      throw new Error('access token key and secret required to set an authorized user');
    }
    _this.user.accessTokenKey     = accessTokenKey;
    _this.user.accessTokenSecret  = accessTokenSecret;
    return new Promise((resolve, reject) => {
      if (!userData) {
        _this.getApi().get('account/verify_credentials', {}, (error, data, response) => {
          if (error) return reject(error);
          _this.user.data = data;
          return resolve(_this.user.data);
        });
      } else {
        _this.user.data = userData;
        return resolve(_this.user.data);
      }
    });
  };

  this.getUser = () => {
    return this.user.data;
  };

  this.getUserTimeline = (screenName, options) => {
    options = options ? options : {};
    options.screen_name = screenName;
    return new Promise((resolve, reject) => {
      _this.getApi().get('statuses/user_timeline', options, (error, data, response) => {
        if (error) return reject(error);
        return resolve(data);
      });
    });
  };

  this.getRetweets = (tweetId, options) => {
    options = options ? options : {};
    options.id = tweetId;
    return new Promise((resolve, reject) => {
      _this.getApi().get('statuses/retweets/:id', options, (error, data, response) => {
        if (error) return reject(error);
        return resolve(data);
      });
    });
  };

  this.getFavorites = (name) => {
    return new Promise((resolve, reject) => {
      _this.getApi().get('favorites/list', { count: 100, screen_name: name }, (error, data, response) => {
        if (error) return reject(error);
        let favorite_list = [];
        favorite_list = data.map(favorite => {
          return favorite.user.screen_name;
        })
        return resolve(favorite_list)
      });
    });
  }

  this.oauth1 = require('./oauth1')(_this.config.oauth1);

};

module.exports = configure => {
  return new twitter(configure);
};
