import {
  FETCH_SITEMAP
} from '../actions/types';

const initState = {
  sitemap: null
}

export default function(state=initState, action) {
  switch(action.type) {
    case FETCH_SITEMAP:
      return { ...state, sitemap: action.payload.sitemap };
    default:
      return state;
  }
}