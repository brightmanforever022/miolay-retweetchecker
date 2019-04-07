'use strict';

const Promise   = require('bluebird');
const oauth     = require('oauth');

const oauth1 = function(config){
  const _this = this;

  this.getService = () => {
    return new oauth.OAuth(
      'https://api.twitter.com/oauth/request_token',
      'https://api.twitter.com/oauth/access_token',
      config.consumerKey,
      config.consumerSecret,
      "1.0A",
      //config.callback,
      config.callback,
      "HMAC-SHA1"
    );
  };

  this.init = () => {
    return new Promise((resolve, reject) => {
      _this.getService().getOAuthRequestToken((error, requestTokenKey, requestTokenSecret, results) => {
        if (error) return reject(error);
        if (!results.oauth_callback_confirmed) {
          return reject('OAuth callback not confirmed');
        }
        return resolve ({
          requestTokenKey: requestTokenKey,
          requestTokenSecret: requestTokenSecret,
          authorizeUrl: 'https://api.twitter.com/oauth/authorize?oauth_token=' + requestTokenKey
        });
      });
    });
  };

  this.authorize = (requestTokenKey, requestTokenSecret, oauthVerifier) => {
    return new Promise((resolve, reject) => {
      _this.getService().getOAuthAccessToken(requestTokenKey, requestTokenSecret, oauthVerifier, (error, accessTokenKey, accessTokenSecret, results) => {
        if (error) return reject(error);
        return resolve({
          accessTokenKey: accessTokenKey,
          accessTokenSecret: accessTokenSecret
        });
      });
    });
  };

};

module.exports = config => {
  return new oauth1(config);
};
