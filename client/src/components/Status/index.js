import React, { Component } from 'react';
import '../../scss/index.scss';
import '../../App.scss';
import '../../scss/queries.scss';
import Tweet from '../Tweet';
import Report from '../Report';
import TeaserBlock from '../TeaserBlock';
import Loader from '../Loader';
import { searchTwitter } from '../../actions/index';
import {connect} from 'react-redux';


class Status extends Component {

  share_fb = (e, tweetValue) => {
    e.preventDefault();
    let url = '';
    url = "https://www.facebook.com/sharer/sharer.php?u=https://twitter.com/";
    url += tweetValue.username;
    window.open(url, 'Facebook Share', "width=626, height=436");
  };

  share_twitter = (e, tweetValue) => {
    e.preventDefault();
    let url = '';
    url += "https://twitter.com/intent/tweet?text=I+just+checked+";
    url += tweetValue.name + "%27s+tweet+on+RetweetChecker+and+the+account+appears+to+be+";
    url += tweetValue.adverb + " " + this.getAdjective(tweetValue.retweeters) + ". ";
    url += "https://twitter.com/";
    url += tweetValue.username;
    window.open(url, 'Twitter Share', "width=626, height=436");
  };

  financial = (x) => {
    return Number.parseFloat(x).toFixed(0);
  };

  getAdjective = (retweeters) => {
    let realCount = 0;
    let suspiciousCount = 0;
    for (let i in retweeters) {
      if (retweeters[i].analysis.classification === 'real') {
        realCount++
      } else if (retweeters[i].analysis.classification === 'suspicious') {
        suspiciousCount++
      }
    }
    let realPercent = parseInt(this.financial(realCount / retweeters.length * 100));
    let suspiciousPercent = parseInt(this.financial(suspiciousCount / retweeters.length * 100));
    if ((realPercent + suspiciousPercent) > 100) {
      suspiciousPercent = 100 - realPercent;
    }
    let botsPercent = 100 - realPercent - suspiciousPercent;
    let adjective = '';
    
    // Define which percent is predominant. real or suspicious or bots ?
    if (realPercent >= suspiciousPercent && realPercent >= botsPercent) {
      adjective = 'real';
    } else if (suspiciousPercent >= realPercent && suspiciousPercent >= botsPercent) {
      adjective = 'suspicious';
    } else {
      adjective = 'bots';
    }
    return adjective;
  }

  state = {
    isGetting: true
  };
  componentDidMount() {
    let searchText = '/status/' + this.props.match.params.search;
    this.props.searchTwitter(searchText);
  }
  componentWillReceiveProps(nextProps) {
    this.setState({ isGetting: false });
  }

  render() {
    const { recent } = this.props;
    let searchResults = [];
    let loader = this.state.isGetting ? <Loader key="profileLoader" />:null;
    let noData = this.state.isGetting ? null : <div class="no-data">There are no data for this status</div>
    searchResults.push(loader);
    if( recent.tweetData ) {
      const hasRecentRetweeters = recent.retweeters.length > 0;
      var keyValue = 1;
      recent.tweetData.forEach(tweetItem => {
        searchResults.push(<Tweet
          id={'statustweet_' + keyValue}
          key={'statustweet_' + keyValue}
          { ... tweetItem }
          expanded={hasRecentRetweeters}
        />);
        keyValue ++
        searchResults.push(
          <div className="toolbar" id="483" key="483">
            <span> 3.1k</span>
            <a className="twitter" href="/shareTwitter" onClick={(e) => this.share_twitter(e, {...tweetItem})}><span></span></a>
            <a className="facebook" href="shareFacebook" onClick={(e) => this.share_fb(e, {...tweetItem})}><span></span></a>
          </div>
        );
      });
      if (hasRecentRetweeters) {
        if(this.props.loggedIn) {
          searchResults.push(<Report
            id="status_482"
            key="status_482"
            { ... recent.reportData }
          />);
        } else {
          searchResults.push(<TeaserBlock id="381" key="381" />);
        }
      }
    } else {
      searchResults.push(noData)
    }

    return (
      <div className="App">
        <section className="App-body">
            <div className="profile-section searchResults">
              {searchResults}
            </div>
        </section>
      </div>
    );
  }
}

const mapStateToProps = state =>{
  return {
    loggedIn: state.auth.authenticated,
    recent: state.recent
  }
};

export default connect(mapStateToProps, { searchTwitter })(Status);
