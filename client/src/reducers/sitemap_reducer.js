import {
  FETCH_SITEMAP
} from '../actions/types';

export default function(state={}, action) {
  switch(action.type) {
    case FETCH_SITEMAP:
      return { ...state, sitemap: action.payload };
    default:
      return state;
  }
}