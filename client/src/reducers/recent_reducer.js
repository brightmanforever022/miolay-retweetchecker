import {
  FETCH_RECENT,
  FETCH_SEARCH,
  REFRESH_TWEET
} from '../actions/types'

const initState = {
  recentList: [],
  tweetData: null,
  reportData: null,
  retweeters: [],
  loading: null
}

export default function(state = initState, action) {
  switch(action.type) {
    case FETCH_RECENT: {
      const { payload } = action
      return {
        ...state,
        loading: 'FETCH_RECENT',
        recentList: payload
      }
    }
    case FETCH_SEARCH: {
      if(action.payload.error) {
        return { error: action.payload.error }
      } else {
        const { data, type, checkType, addedRecent } = action.payload
        let { recentList } = state
        let newRecentList = []
        let tweetData = []
        if (Array.isArray(data)) {
          data.forEach(item => {
            let tempRecent = {
              showFull: checkType==='full'?true:false,
              name: item.tweet.user.name,
              username: item.tweet.user.screenName,
              avatar: item.tweet.user.profileImageUrl,
              tweetDate: item.tweet.date,
              searchDate: changeDateFormat(item.updatedAt),
              content: item.tweet.content,
              countRetweets: item.tweet.counts.retweets,
              countLikes: item.tweet.counts.likes,
              adverb: 'mostly',
              adjective: item.probabilityMatrix.analysis.classification,
              retweetId: item.tweet.id,
              retweeters: item.retweeters,
              type: 'user'
            }
            newRecentList.push(tempRecent)
            tweetData.push(tempRecent)
          })

        } else {
          let newRecent = {}
          if (type === 'user') {
            newRecent = {
              showFull: checkType === 'full' ? true : false,
              name: data.tweet.user.name,
              username: data.tweet.user.screenName,
              avatar: data.tweet.user.profileImageUrl,
              tweetDate: data.tweet.date,
              searchDate: changeDateFormat(data.updatedAt),
              content: data.tweet.content,
              countRetweets: data.tweet.counts.retweets,
              countLikes: data.tweet.counts.likes,
              adverb: 'mostly',
              adjective: data.probabilityMatrix.analysis.classification,
              retweetId: data.tweet.id,
              retweeters: data.retweeters,
              type: 'user'
            }
          } else {
            newRecent = {
              showFull: checkType === 'full' ? true : false,
              name: data.tweet.user.name,
              username: data.tweet.user.screenName,
              avatar: data.tweet.user.profileImageUrl,
              tweetDate: data.tweet.date,
              searchDate: changeDateFormat(data.updatedAt),
              content: data.tweet.content,
              countRetweets: data.tweet.counts.retweets,
              countLikes: data.tweet.counts.likes,
              adverb: 'mostly',
              adjective: '',
              retweetId: data.tweet.id,
              retweeters: data.retweeters,
              type: 'tweet'
            }
          }
          if (addedRecent && newRecent.showFull) {
            newRecentList.push(newRecent)
          }
          tweetData.push(newRecent)
        }

        return {
          ...state,
          loading: 'FETCH_SEARCH',
          searchType: type,
          searchResult: data,
          recentList: [
            ...newRecentList,
            ...recentList
          ],
          tweetData: tweetData,
          retweeters: data.retweeters,
          reportData: {}
        }
      }
    }
    case REFRESH_TWEET: {
      const { data, checkType } = action.payload
      let { recentList } = state
      for (let i in recentList) {
        if (recentList[i].retweetId === data.tweet.id) {
          recentList[i] = {
            showFull: checkType==='full'?true:false,
            name: data.tweet.user.name,
            username: data.tweet.user.screenName,
            avatar: data.tweet.user.profileImageUrl,
            tweetDate: data.tweet.date,
            searchDate: changeDateFormat(data.updatedAt),
            content: data.tweet.content,
            countRetweets: data.tweet.counts.retweets,
            countLikes: data.tweet.counts.likes,
            adverb: 'mostly',
            adjective: '',
            retweetId: data.tweet.id,
            retweeters: data.retweeters,
            type: 'tweet'
          }
        }
      }
        
      return {
        ...state,
        loading: 'REFRESH_TWEET',
        recentList: recentList
      }
    }
    default:
      return state
  }
}

function changeDateFormat(dateTimeString) {
  let originalDateTime = new Date(dateTimeString);
  const splitDateTimeString = originalDateTime.toLocaleString('en-US').toLowerCase().split(', ');
  const splitTimeString = splitDateTimeString[1].split(' ');
  return splitDateTimeString[0] + ' @ ' + splitTimeString[0].substr(0, 5) + ' ' + splitTimeString[1];
}