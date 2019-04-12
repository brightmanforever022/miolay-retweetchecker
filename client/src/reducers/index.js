import { combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';

import authReducer from './auth_reducer';
import profileReducer from './profile_reducer';
import recentReducer from './recent_reducer';
import retweetsReducer from './retweets_reducer';
import sitemapReducer from './sitemap_reducer';

const rootReducer = combineReducers({
    form: formReducer,
    auth: authReducer,
    profile: profileReducer,
    recent: recentReducer,
    retweets: retweetsReducer,
    sitemap: sitemapReducer,
});

export default rootReducer;