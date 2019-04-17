import React, { Component } from 'react'
import '../../scss/index.scss'
import '../../App.scss'
import '../../scss/queries.scss'
import Header from '../Header'
import Footer from '../Footer'
import Tweet from '../Tweet'
import Report from '../Report'
import TeaserBlock from '../TeaserBlock'
import Loader from '../Loader'
import { searchTwitter } from '../../actions/index'
import {connect} from 'react-redux'


class Profile extends Component {

  share_fb = (e, tweetValue) => {
    e.preventDefault()
    let url = ''
    url = "https://www.facebook.com/sharer/sharer.php?u=https://twitter.com/"
    url += tweetValue.name
    window.open(url, 'Facebook Share', "width=626, height=436")
  };

  share_twitter = (e, tweetValue) => {
    e.preventDefault()
    let url = ''
    url += "https://twitter.com/intent/tweet?text=I+just+checked+"
    url += tweetValue.name + "%27s+Tweeter+account+on+RetweetChecker+and+the+account+appears+to+be+"
    url += tweetValue.adverb + " " + tweetValue.adjective + ". "
    url += "https://miolay-rtc-new.herokuapp.com/profile/"
    url += tweetValue.name
    window.open(url, 'Twitter Share', "width=626, height=436")
  }
  
  state = {
    isGetting: true
  }
  componentDidMount() {
    let searchText = this.props.match.params.search
    this.props.searchTwitter(searchText)
  }
  componentWillReceiveProps(nextProps) {
    this.setState({ isGetting: false })
  }

  render() {
    console.log('profile rendered')
    const { recent } = this.props
    let searchResults = []
    let loader = this.state.isGetting ? <Loader key="profileLoader" />:null
    searchResults.push(loader)
    const hasRecentRetweeters = recent.retweeters.length > 0
    if( recent.tweetData ) {
      var keyValue = 1
      recent.tweetData.forEach(tweetItem => {
        searchResults.push(<Tweet
          id={'profiletweet_' + keyValue}
          key={'profiletweet_' + keyValue}
          { ... tweetItem }
          expanded={hasRecentRetweeters}
        />)
        keyValue ++
        searchResults.push(
          <div className="toolbar" id="483" key="483">
            <span> 3.1k</span>
            <a className="twitter" href="/shareTwitter" onClick={(e) => this.share_twitter(e, {...tweetItem})}><span></span></a>
            <a className="facebook" href="/shareFacebook" onClick={(e) => this.share_fb(e, {...tweetItem})}><span></span></a>
          </div>
        )
      })
      if (hasRecentRetweeters) {
        if(this.props.loggedIn) {
          searchResults.push(<Report
            id="profile_482"
            key="profile_482"
            { ... recent.reportData }
          />)
        } else {
          searchResults.push(<TeaserBlock id="381" key="381" />)
        }
      }
    }

    return (
      <div className="App">
        <Header />
        <div className="App">
          <section className="App-body">
            <div className="profile-section searchResults">
              {searchResults}
            </div>
          </section>
        </div>
        <Footer />
      </div>
    )
  }
}

const mapStateToProps = state =>{
  return {
    loggedIn: state.auth.authenticated,
    recent: state.recent
  }
}

export default connect(mapStateToProps, { searchTwitter })(Profile)
