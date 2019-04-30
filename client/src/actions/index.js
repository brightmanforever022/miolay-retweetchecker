import axios from 'axios'
import {
  AUTH_USER,
  REDIRECT_USER,
  UNAUTH_USER,
  FETCH_PROFILE,
  FETCH_RECENT,
  FETCH_RETWEETS,
  FETCH_SEARCH,
  REFRESH_TWEET,
  FETCH_SITEMAP
} from './types'

// const ROOT_URL = 'http://127.0.0.1:8888/api'
const ROOT_URL = '/api'

/**
 * Authentication
 */

export function signinUser() {

  // Using redux-thunk (instead of returning an object, return a function)
  // All redux-thunk doing is giving us arbitrary access to the dispatch function, and allow us to dispatch our own actions at any time we want
  return function(dispatch) {

    // Submit email/password to the server
    axios.get(`${ROOT_URL}/login`)  // axios returns a promise
      .then(response => {  // If request is good (sign in succeeded) ...
        const {data} = response
        // - Save the JWT token (use local storage)
        localStorage.setItem('token',data.session.twitterRequestTokenKey)
        localStorage.setItem('twitterRequestTokenKey',data.session.twitterRequestTokenKey)
        localStorage.setItem('twitterRequestTokenSecret',data.session.twitterRequestTokenSecret)

        dispatch({
          type: REDIRECT_USER,
          payload: data.redirect,
        })
      })
      .catch(() => {  // If request is bad (sign in failed) ...

        // - Redirect (REPLACE) to the route '/signin', then show an error to the user
        /*historyReplace('/login', {
          time: new Date().toLocaleString(),
          message: 'Authentication failed'
        })*/
      })
  }
}

export function signCallbackHandling(tokens) {
  return function(dispatch) {
    const twitterRequestTokenKey = localStorage.getItem('twitterRequestTokenKey')
    const twitterRequestTokenSecret = localStorage.getItem('twitterRequestTokenSecret')
    localStorage.setItem('rtc-token', tokens)
    axios.get(`${ROOT_URL}/login/callback${tokens}`,{params: {
      twitterRequestTokenKey,
      twitterRequestTokenSecret
    }})
    .then(result=>{
      const {data} = result
      localStorage.setItem('user_avatar',data.twitterUser.avatar)
      localStorage.setItem('user_name',data.twitterUser.screen_name)
      if (data.twitterUser.screen_name.length > 0) {
        dispatch({
          type: AUTH_USER,
          payload: {username:data.twitterUser.screen_name, image: data.twitterUser.avatar},
        })
      } else {
        dispatch({
          type: UNAUTH_USER,
          payload: null,
        })
      }
    })
  }
}

export function signupUser({ email, password, firstName, lastName }, historyPush, historyReplace) {

  return function(dispatch) {

    axios.post(`${ROOT_URL}/signup`, { email, password, firstName, lastName })  // axios returns a promise
      .then(response => {  // If request is good (sign up succeeded) ...

        // - Redirect (PUSH) to the route '/signin', then show a success message to the user
        historyPush('/signin', { time: new Date().toLocaleString(), message: response.data.message })
      })
      .catch(({response}) => {  // If request is bad (sign up failed) ...

        // - Redirect (REPLACE) to the route '/signup', then show an error to the user
        historyReplace('/signup', { time: new Date().toLocaleString(), message: response.data.message })
      })
  }
}

export function signoutUser() {

  return function(dispatch) {
    axios.get(`${ROOT_URL}/logout`, {
      headers: { authorization: localStorage.getItem('token') }
    }).then(response => {
      // - Delete the JWT token from local storage
      localStorage.removeItem('token')
      localStorage.removeItem('rtc-token')
      localStorage.removeItem('twitterRequestTokenKey')
      localStorage.removeItem('twitterRequestTokenSecret')
      localStorage.removeItem('user_avatar')
      localStorage.removeItem('user_name')
      
      dispatch({
        type: UNAUTH_USER,
        payload: null,
      })
    })
  }
}


/**
 * User information
 */

export function fetchProfile() {

  return function(dispatch) {
    axios.post(`${ROOT_URL}/profile`, {
      headers: { authorization: localStorage.getItem('token') }
    }).then(response => {
      dispatch({
        type: FETCH_PROFILE,
        payload: response.data.user,
      })
    })
  }
}

export function fetchRetweets(id) {

  return function(dispatch) {
    axios.post(`${ROOT_URL}/status/${id}`).then(response => {
      dispatch({
        type: FETCH_RETWEETS,
        payload: response.data,
      })
    })
  }
}

/**
 * Blog Post
 */

export function fetchRecent() {

  return function(dispatch) {
    axios.get(`${ROOT_URL}/recent`).then((response) => {
      let recentList = []
      response.data.forEach(element => {
        let temp = {}
        let tempImageUrl = element.result.tweet.user.profileImageUrl
        let avatarUrl = tempImageUrl.replace('http://', 'https://')
        if (element.type === 'user') {
          temp = {
            showFull: element.checkType==='full'?true:false,
            name: element.result.tweet.user.name,
            username: element.result.tweet.user.screenName,
            avatar: avatarUrl,
            tweetDate: element.result.tweet.date,
            searchDate: changeDateFormat(element.result.updatedAt),
            content: element.result.tweet.content,
            countRetweets: element.result.tweet.counts.retweets,
            countLikes: element.result.tweet.counts.likes,
            adverb: 'mostly',
            adjective: element.result.probabilityMatrix.analysis.classification,
            retweetId: element.result.retweetId,
            retweeters: element.result.retweeters,
            type: 'user'
          }
        } else {
          temp = {
            showFull: element.checkType==='full'?true:false,
            name: element.result.tweet.user.name,
            username: element.result.tweet.user.screenName,
            avatar: avatarUrl,
            tweetDate: element.result.tweet.date,
            searchDate: changeDateFormat(element.result.updatedAt),
            content: element.result.tweet.content,
            countRetweets: element.result.tweet.counts.retweets,
            countLikes: element.result.tweet.counts.likes,
            adverb: 'mostly',
            adjective: '',
            retweetId: element.result.retweetId,
            retweeters: element.result.retweeters,
            type: 'tweet'
          }
        }
        recentList.push(temp)
      })
      dispatch({
        type: FETCH_RECENT,
        payload: recentList,
      })
    })
  }
}

export function searchTwitter(value) {
  let tokens = localStorage.getItem('rtc-token') ? localStorage.getItem('rtc-token') : ''
  const user_name = localStorage.getItem('user_name') ? localStorage.getItem('user_name') : ''
  return function(dispatch) {
    axios.post(`${ROOT_URL}/fullChecker${tokens}`,
      { check: value, user_name: user_name, refresh: 0 }
    ).then(response => {
      dispatch({
        type: FETCH_SEARCH,
        payload: response.data,
      })
    }).catch(error => {
      dispatch({
        type: FETCH_SEARCH,
        payload: {error: error},
      })
    })
  }
}

export function refreshTwitter(value) {
  let tokens = localStorage.getItem('rtc-token') ? localStorage.getItem('rtc-token') : ''
  const user_name = localStorage.getItem('user_name') ? localStorage.getItem('user_name') : ''
  return function(dispatch) {
    axios.post(`${ROOT_URL}/fullChecker${tokens}`,
      { check: value, user_name: user_name, refresh: 1 }
    ).then(response => {
      dispatch({
        type: REFRESH_TWEET,
        payload: response.data,
      })
    }).catch(error => {
      dispatch({
        type: REFRESH_TWEET,
        payload: {error: error},
      })
    })
  }
}

export function fetchSitemap() {
  return function(dispatch) {
    axios.get(`${ROOT_URL}/sitemap`).then(response => {
      dispatch({
        type: FETCH_SITEMAP,
        payload: response.data,
      })
    }).catch(error => {
      dispatch({
        type: FETCH_SITEMAP,
        payload: {error: error}
      })
    })
  }
}

function changeDateFormat(dateTimeString) {
  let originalDateTime = new Date(dateTimeString)
  const dateTimeOptions = { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
  const splitDateTimeString = originalDateTime.toLocaleString('en-US', dateTimeOptions).toLowerCase().split(', ')
  const splitTimeString = splitDateTimeString[1].split(' ')
  return splitDateTimeString[0] + ' @ ' + splitTimeString[0].substr(0, 5) + ' ' + splitTimeString[1]
}
