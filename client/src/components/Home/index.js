import React, { Component } from 'react'
import '../../scss/index.scss'
import '../../App.scss'
import '../../scss/queries.scss'
import Header from '../Header'
import Footer from '../Footer'
import Searchbar from '../Searchbar'
import RecentList from '../RecentList'
import Tweet from '../Tweet'
import Report from '../Report'
import TeaserBlock from '../TeaserBlock'
import {connect} from 'react-redux'

class Home extends Component {

  share_fb = (e, tweetValue) => {
    e.preventDefault()
    let url = ''
    url = "https://www.facebook.com/sharer/sharer.php?u=https://twitter.com/"
    url += tweetValue.username
    window.open(url, 'Facebook Share', "width=626, height=436")
  }

  share_twitter = (e, tweetValue) => {
    e.preventDefault()
    let url = ''
    url += "https://twitter.com/intent/tweet?text=I+just+checked+"
    url += tweetValue.name + "%27s+tweet+on+RetweetChecker+and+the+account+appears+to+be+"
    url += tweetValue.adverb + " " + this.getAdjective(tweetValue.retweeters) + ". "
    url += "https://twitter.com/"
    url += tweetValue.username
    window.open(url, 'Twitter Share', "width=626, height=436")
  }

  financial = (x) => {
    return Number.parseFloat(x).toFixed(0)
  }

  getAdjective = (retweeters) => {
    let realCount = 0
    let suspiciousCount = 0
    for (let i in retweeters) {
      if (retweeters[i].analysis.classification === 'real') {
        realCount++
      } else if (retweeters[i].analysis.classification === 'suspicious') {
        suspiciousCount++
      }
    }
    let realPercent = parseInt(this.financial(realCount / retweeters.length * 100))
    let suspiciousPercent = parseInt(this.financial(suspiciousCount / retweeters.length * 100))
    if ((realPercent + suspiciousPercent) > 100) {
      suspiciousPercent = 100 - realPercent
    }
    let botsPercent = 100 - realPercent - suspiciousPercent
    let adjective = ''
    
    // Define which percent is predominant. real or suspicious or bots ?
    if (realPercent >= suspiciousPercent && realPercent >= botsPercent) {
      adjective = 'real'
    } else if (suspiciousPercent >= realPercent && suspiciousPercent >= botsPercent) {
      adjective = 'suspicious'
    } else {
      adjective = 'bots'
    }
    return adjective
  }

  render() {
    const { recent } = this.props
    let searchResults = []
    if( recent.tweetData ) {
      const hasRecentRetweeters = recent.retweeters.length > 0
      var keyValue = 1
      recent.tweetData.forEach(tweetItem => {
        searchResults.push(<Tweet
          id={'tweet_' + keyValue}
          key={'tweet_' + keyValue}
          inRecent="no"
          { ... tweetItem }
          expanded={hasRecentRetweeters}
        />)
        keyValue ++
        searchResults.push(
          <div className="toolbar" id="483" key="483">
            <span> 3.1k</span>
            <a className="twitter" href="/shareTwitter" onClick={(e) => this.share_twitter(e, {...tweetItem})}><span></span></a>
            <a className="facebook" href="/shareTwitter" onClick={(e) => this.share_fb(e, {...tweetItem})}><span></span></a>
          </div>
        )
      })
      if (hasRecentRetweeters) {
        if(this.props.loggedIn) {
          searchResults.push(<Report
            id="482"
            key="482"
            { ... recent.reportData }
          />)
        } else {
          searchResults.push(<TeaserBlock id="381" key="381" />);
        }
      }
    }
    
    return (
      <div className="App">
        <Header />
        <section className="App-body">
          <h1 className="main-title">Check Fake Twitter Retweets</h1>
          <Searchbar />
          <div className="searchResults">
            {searchResults}
          </div>
          <RecentList />
        </section>
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

export default connect(mapStateToProps, null)(Home)
