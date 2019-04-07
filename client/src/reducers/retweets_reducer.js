import {
  REFRESH_TWEET
} from '../actions/types';

const initState = {
  tweetData: null,
  retweeters: []
}

export default function(state = initState, action) {
  // Attention!!! The state object here refers to state.comments, instead of the application state.

  switch(action.type) {
    case REFRESH_TWEET: {
      const { data, checkType } = action.payload
      let newRecent = {
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
      };
        
      return {
        ...state,
        loading: 'REFRESH_TWEET',
        tweetData: newRecent,
        retweeters: data.retweeters
      }
    }
    default:
      return state;
  }
}

function changeDateFormat(dateString) {
  let originalDate = new Date(dateString);
  return originalDate.toLocaleString('en-US').toLowerCase();
}