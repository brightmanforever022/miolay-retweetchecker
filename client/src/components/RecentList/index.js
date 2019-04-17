import React, { Component } from 'react'
// import { Link } from 'react-router-dom';
import { connect } from 'react-redux'
import { fetchRecent } from '../../actions/index'
import Loader from '../Loader'

import Tweet from '../Tweet'

class RecentList extends Component {

  state = {
    recent: [],
    isSearching: true
  };
  componentDidMount() {
    this.props.fetchRecent()
  }

  componentWillReceiveProps(nextProps) {
    const { recent } = nextProps
    if (recent.loading === 'FETCH_RECENT' || recent.loading === 'FETCH_SEARCH') {
      this.setState({ recent: recent.recentList, isSearching: false })
    }
  }

  render(){
    let loader = this.state.isSearching ? <Loader /> : null
    let tweetsJSX = []
    if(this.state.recent.length > 0) {
      for ( let i in this.state.recent ) {

        tweetsJSX.push(
          <Tweet
            key={i}
            id={i}
            inRecent="yes"
            { ...this.state.recent[i] }
          />
        )
      }
    }
    return (
      <div className="recent-list">
        <h2>Recent Tweets Checked</h2>
        { loader }
        <div className="recent-entries">
          {tweetsJSX}
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return { recent: state.recent }
}

export default connect(mapStateToProps, { fetchRecent })(RecentList)
