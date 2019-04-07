var config, twitter
require('dotenv').config()
if (process.env.NODE_ENV === 'development') {
  config = require('../config/dev')
  twitter = require('../lib/twitter')(config.twitter)
} else {
  config = require('../config/product')
  twitter = require('../lib/twitter')(config.twitter)
}

const uuid4 = require('uuid/v4')

let reqDB
let reqTwitter
// const isOutdated = record => {
//   if (!record.updatedAt) return true
//   if ((new Date(record.updatedAt)) <= (new Date(Date.now() - (config.cache.lifetimeSeconds * 1000)))) {
//     return true
//   }
//   return false
// }

const getOne = (type, model, check, apiMethod, apiMethodOptions, checkType, isRefresh = 0) => {
  return model.find(check).then(result => {
    if (!result || result.length === 0 || isRefresh) {
      return apiMethod(check, apiMethodOptions)
    } else {
      return Promise.resolve(result[0])
    }
  }).then(result => {
    if (!result._id) {
      return model.setFromApiResult(result, checkType)
    } else {
      return Promise.resolve(result)
    }
  }).then(result => {
    return result
  })
}
const checkRetweet = nextResult => {
  let firstRetweetId = ''
  for (let i in nextResult) {
    if (nextResult[i].retweeted_status && firstRetweetId === '') {
      firstRetweetId = nextResult[i].retweeted_status.id_str
    }
  }
  return { id: firstRetweetId, lastRow: nextResult[nextResult.length - 1] }
}
const checkRetweetResult = (result, check, apiMethod, apiMethodOptions) => {
  let checkResult = checkRetweet(result)
  let firstRetweetId = checkResult.id
  let lastRow = checkResult.lastRow
  if (firstRetweetId === '') {
    apiMethodOptions.max_id = lastRow.id
    return apiMethod(check, apiMethodOptions).then(result2 => {
      return checkRetweetResult(result2, check, apiMethod, apiMethodOptions)
    })
  } else {
    return Promise.resolve(result)
  }
}
const getRetweetByUsername = (type, model, check, apiMethod, apiMethodOptions, checkType) => {
  return model.find(check, checkType).then(result => {
    // if (!result || result.length === 0 || isOutdated(result[0])) {
    return apiMethod(check, apiMethodOptions)
    // } else {
    //   return Promise.resolve(result[0]);
    // }
  }).then(result => {
    if (!result._id) {
      return checkRetweetResult(result, check, apiMethod, apiMethodOptions)
    } else {
      return Promise.resolve(result)
    }
  }).then(result => {
    if (!result._id) {
      let firstRetweetId = ''
      let statusResult
      for (let i in result) {
        if (result[i].retweeted_status && firstRetweetId === '') {
          firstRetweetId = result[i].retweeted_status.id_str
          statusResult = result[i]
        }
      }
      // Get retweeters by firstRetweetId
      if (firstRetweetId === '') {
        return model.setUserResult(result, result[0], [], checkType, firstRetweetId)
      } else {
        return getOne(
          'tweet',
          require('../models/retweets')(reqDB),
          firstRetweetId,
          reqTwitter.getRetweets,
          { count: config.twitter.limits.retweets, tweet_mode: 'extended' },
          checkType
        ).then(result1 => {
          const promises = []
          let tempResult = result1
          for (let j in tempResult.retweeters) {
            promises.push(getOne(
              'user',
              require('../models/user')(reqDB),
              tempResult.retweeters[j].screenName,
              reqTwitter.getUserTimeline,
              { count: config.twitter.limits.timeline },
              checkType
            ))
          }
          return Promise.all(promises).then(retweeters => {
            for (let k in tempResult.retweeters) {
              tempResult.retweeters[k]['analysis'] = retweeters[k].probabilityMatrix.analysis
              tempResult.retweeters[k]['followedBy'] = retweeters[k].probabilityMatrix.followedBy
            }
            let returnValue = model.setUserResult(result, statusResult, tempResult.retweeters, checkType, firstRetweetId)
            return Promise.resolve(returnValue)
          }).catch(err => {
            console.log(err)
          })
        }).catch(e => {
          console.error(e)
        })
      }
    } else {
      return Promise.resolve(result)
    }
  })
}

exports.fullChecker = (req, res) => {
  reqDB = req.db
  reqTwitter = req.twitter
  var authorizedUser = false
  // reqTwitter.getFavorites('jimmfelton').then(result => {console.log(result)})
  // If not authenticated with twitter account, authenticate with internal twitter api account access
  // twitter.oauth1.authorize(req.body.twitterRequestTokenKey, req.body.twitterRequestTokenSecret, req.query.oauth_verifier).then(result => {
  let twitUserName = req.body.user_name
  // console.log('request: ', req.body);
  if (req.body.user_name.length > 0 && req.query.oauth_verifier) {
    authorizedUser = true
    twitter.setUser(config.twitter.oauth1.accessTokenKey, config.twitter.oauth1.accessTokenSecret);
  } else {
    twitter.setUser(config.twitter.oauth1.accessTokenKey, config.twitter.oauth1.accessTokenSecret);
  }
  let checker = req.body.check
  if (checker.indexOf(',') >= 0) {
    const checks = checker.split(',')
    const promises = []
    for (let i in checks) {
      promises.push(getOne(
        'user',
        require('../models/user')(reqDB),
        checks[i].trim(),
        reqTwitter.getUserTimeline,
        { count: config.twitter.limits.timeline, tweet_mode: 'extended' },
        authorizedUser ? 'full' : 'quick'
      ))
    }
    Promise.all(promises).then(result => {
      res.json({
        type: 'users',
        data: result ? result : []
      })
    }).catch(error => {
      console.error(error)
      res.status(500).json(error)
    })
  } else if (checker.indexOf('status/') >= 0) {
    let retweetsModel = require('../models/retweets')(reqDB)
    let searchTerm = checker.split('/').pop()
    const isRefresh = req.body.refresh
    return retweetsModel.find(searchTerm).then(retweetsResult => {
      if (!retweetsResult || retweetsResult.length === 0 || isRefresh) {
        return getOne(
          'tweet',
          require('../models/retweets')(reqDB),
          checker.split('/').pop(),
          reqTwitter.getRetweets,
          { count: config.twitter.limits.retweets, tweet_mode: 'extended' },
          authorizedUser ? 'full' : 'quick',
          isRefresh
        ).then(tweetResult => {
          let recent = require('../models/recent')(reqDB)
          let checkType = 'quick'
          if (authorizedUser) {
            checkType = 'full'
          }
          recent.id = uuid4()
          recent.type = 'tweet'
          recent.checkType = checkType
          recent.search = checker.split('/').pop()
          recent.result = tweetResult
          recent.result.retweetId = checker.split('/').pop()
          return getOne(
            'user',
            require('../models/user')(reqDB),
            tweetResult.tweet.user.screenName,
            reqTwitter.getUserTimeline,
            { count: config.twitter.limits.timeline },
            authorizedUser ? 'full' : 'quick',
            isRefresh
          ).then(userResult => {
            return reqTwitter.getFavorites(tweetResult.tweet.user.screenName).then(favoriteList => {
              recent.result.probabilityMatrix = userResult.probabilityMatrix
              const promises = []
              let numberofRetweetAndFavorite = 0
              for (let i in tweetResult.retweeters) {
                promises.push(getOne(
                  'user',
                  require('../models/user')(reqDB),
                  tweetResult.retweeters[i].screenName,
                  reqTwitter.getUserTimeline,
                  { count: config.twitter.limits.timeline },
                  authorizedUser ? 'full' : 'quick',
                  isRefresh
                ))
                if (favoriteList.includes(tweetResult.retweeters[i].screenName)) {
                  numberofRetweetAndFavorite ++
                }
              }
              
              return Promise.all(promises).then(retweeters => {
                for (let j in tweetResult.retweeters) {
                  tweetResult.retweeters[j]['analysis'] = retweeters[j].probabilityMatrix.analysis
                  tweetResult.retweeters[j]['followedBy'] = retweeters[j].probabilityMatrix.followedBy
                }
                tweetResult.numberofRetweetAndFavorite = numberofRetweetAndFavorite
                recent.result.retweeters = tweetResult.retweeters
                recent.result.updatedAt = new Date()
                recent.checkType = checkType
                recent.numberofRetweetAndFavorite = numberofRetweetAndFavorite
                recent.save(isRefresh).then(savedResult => {
                  let newRetweetsModel = require('../models/retweets')(reqDB)
                  return newRetweetsModel.update(tweetResult).then(retweetsUpdateResponse => {
                    res.json({
                      type: 'tweet',
                      checkType: authorizedUser ? 'full' : 'quick',
                      numberofRetweetAndFavorite: numberofRetweetAndFavorite,
                      addedRecent: savedResult._id ? true : false,
                      data: tweetResult ? tweetResult : {}
                    })
                  }).catch(updateError => {
                    console.log('error in updating retweets: ', updateError)
                  })
                })
              }).catch(err => {
                res.status(500).json(err)
              })
            })
          }).catch(e => {
            console.error(e)
            res.status(500).json(e)
          })
        }).catch(error => {
          console.error(error)
          res.status(500).json(error)
        })
      } else {
        return getOne(
          'user',
          require('../models/user')(reqDB),
          retweetsResult[0].tweet.user.screenName,
          reqTwitter.getUserTimeline,
          { count: config.twitter.limits.timeline },
          authorizedUser ? 'full' : 'quick'
        ).then(tweetUserResult => {
          // console.log('tweet user result: ', tweetUserResult);
          let probabilityMatrix = tweetUserResult.probabilityMatrix
          // let newRetweetsModel = require('../models/retweets')(reqDB);
          // return newRetweetsModel.update(retweetsResult[0]).then(retweetsUpdateResponse => {
          // let checkType = authorizedUser?'full':'quick';
          
          // Add / Update search result into recent
          // let recent = require('../models/recent')(reqDB);
          // recent.id     = uuid4();
          // recent.type   = 'tweet';
          // recent.checkType = checkType;
          // recent.search = checker.split('/').pop();
          // recent.result = retweetsResult[0];
          // recent.result.retweetId = checker.split('/').pop();
          // recent.result.probabilityMatrix = probabilityMatrix;

          // return recent.save().then(recentSaveResult => {

          reqTwitter.getFavorites(tweetUserResult.tweet.user.screenName).then(favoriteList => {
            numberofRetweetAndFavorite = 0
            for(let i in retweetsResult[0].retweeters.length) {
              if (favoriteList.includes(retweetsResult[0].retweeters[i].screenName)) {
                numberofRetweetAndFavorite ++
              }
            }
            
            res.json({
              type: 'tweet',
              checkType: authorizedUser ? 'full' : 'quick',
              numberofRetweetAndFavorite: numberofRetweetAndFavorite,
              addedRecent: false,
              data: {
                ...retweetsResult[0],
                retweetId: searchTerm,
                probabilityMatrix: probabilityMatrix
              }
            })
          })
          //   });
            
          // }).catch(updateError => {
          //   console.log('error in updating retweets: ', updateError);
          // });
        })
      }
    })
  } else {
    getRetweetByUsername(
      'user',
      require('../models/user')(reqDB),
      checker.split('/').pop(),
      reqTwitter.getUserTimeline,
      { count: 200, tweet_mode: 'extended', include_rts: true },
      authorizedUser ? 'full' : 'quick'
    ).then(result => {
      let recent = require('../models/recent')(reqDB)
      let checkType = 'quick'
      if (authorizedUser) {
        checkType = 'full'
      }
      recent.id = uuid4()
      recent.type = 'user'
      recent.checkType = checkType
      recent.search = checker
      recent.result = result
      recent.save().then(result => {
        recent.clean()
        return result
      }).then(() => {
        res.json({
          type: 'user',
          data: result ? result : {}
        })
      }).catch(error => {
        res.status(500).json(error)
      })
    }).catch(error => {
      console.error(error)
      res.status(500).json(error)
    })
  }
}

exports.simpleChecker = (req, res) => {
  var authorizedUser = false
  if (!req.session.twitterUser) {
    req.session.twitterAccessTokenKey = config.twitter.oauth1.accessTokenKey
    req.session.twitterAccessTokenSecret = config.twitter.oauth1.accessTokenSecret
    twitter.setUser(config.twitter.oauth1.accessTokenKey, config.twitter.oauth1.accessTokenSecret)
  }
  if (req.body.check.indexOf(',') >= 0) {
    const checks = req.body.check.split(',')
    const promises = []
    for (let i in checks) {
      promises.push(getOne(
        'user',
        require('../models/user')(req.db),
        checks[i].trim(),
        req.twitter.getUserTimeline,
        { count: config.twitter.limits.timeline, tweet_mode: 'extended' },
        authorizedUser ? 'full' : 'quick'
      ))
    }
    Promise.all(promises).then(result => {
      res.json({
        type: 'users',
        data: result ? result : []
      })
    }).catch(error => {
      console.error(error)
      res.status(500).json(error)
    })
  } else if (req.body.check.indexOf('/status') >= 0) {
    getOne(
      'tweet',
      require('../models/retweets')(req.db),
      req.body.check.split('/').pop(),
      req.twitter.getRetweets,
      { count: config.twitter.limits.retweets, tweet_mode: 'extended' },
      authorizedUser ? 'full' : 'quick'
    ).then(result => {
      let recent = require('../models/recent')(req.db)
      let checkType = 'quick'
      if (authorizedUser) {
        checkType = 'full'
      }
      recent.id = uuid4()
      recent.type = 'tweet'
      recent.checkType = checkType
      recent.search = req.body.check.split('/').pop()
      recent.result = result
      recent.result.retweetId = req.body.check.split('/').pop()
      getOne(
        'user',
        require('../models/user')(req.db),
        result.tweet.user.screenName,
        req.twitter.getUserTimeline,
        { count: config.twitter.limits.timeline },
        authorizedUser ? 'full' : 'quick'
      ).then(userResult => {
        recent.result.probabilityMatrix = userResult.probabilityMatrix
        const promises = []
        let tempResult = result
        for (let i in tempResult.retweeters) {
          promises.push(getOne(
            'user',
            require('../models/user')(req.db),
            tempResult.retweeters[i].screenName,
            req.twitter.getUserTimeline,
            { count: config.twitter.limits.timeline },
            authorizedUser ? 'full' : 'quick'
          ))
        }
        Promise.all(promises).then(retweeters => {
          for (let j in tempResult.retweeters) {
            tempResult.retweeters[j]['analysis'] = retweeters[j].probabilityMatrix.analysis
            tempResult.retweeters[j]['followedBy'] = retweeters[j].probabilityMatrix.followedBy
          }
          recent.result.retweeters = tempResult.retweeters
          recent.save().then(savedResult => {
            recent.clean()
            return savedResult
          })
          res.json({
            type: 'tweet',
            data: tempResult ? tempResult : {}
          })
        }).catch(err => {
          res.status(500).json(err)
        })
      }).catch(e => {
        console.error(e)
        res.status(500).json(e)
      })
    }).catch(error => {
      console.error(error)
      res.status(500).json(error)
    })
  } else {
    console.log('twitter user: ', authorizedUser)
    getRetweetByUsername(
      'user',
      require('../models/user')(req.db),
      req.body.check.split('/').pop(),
      req.twitter.getUserTimeline,
      { count: 200, tweet_mode: 'extended', include_rts: true },
      authorizedUser ? 'full' : 'quick'
    ).then(result => {
      let recent = require('../models/recent')(req.db)
      let checkType = 'quick'
      if (authorizedUser) {
        checkType = 'full'
      }
      recent.id = uuid4()
      recent.type = 'user'
      recent.checkType = checkType
      recent.search = req.body.check
      recent.result = result
      recent.save().then(result => {
        recent.clean()
        return result
      }).then(() => {
        res.json({
          type: 'user',
          data: result ? result : {}
        })
      }).catch(error => {
        res.status(500).json(error)
      })
    }).catch(error => {
      console.error(error)
      res.status(500).json(error)
    })
  }
}
