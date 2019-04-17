import {
  FETCH_PROFILE
} from '../actions/types'

export default function(state={}, action) {
  switch(action.type) {
    case FETCH_PROFILE:
      return { ...state, user: action.payload }
    default:
      return state
  }
}