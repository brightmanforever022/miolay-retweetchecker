import React, { Component } from 'react';

import { connect } from 'react-redux';
import Loader from '../Loader';
import { refreshTwitter } from '../../actions/index';

import DoughnutChart from '../DoughnutChart/DoughnutChart';

class Tweet extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      isSearching: false
    };

    this.handleRefresh = this.handleRefresh.bind(this);
  }
  handleRefresh () {
    this.props.refreshTwitter('/status/' + this.props.retweetId);
    this.setState({isSearching: true});
  };
  financial = (x) => {
    return Number.parseFloat(x).toFixed(0);
  };
  formatCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if(count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count;
  };

  componentWillReceiveProps (nextProps) {
    this.setState({isSearching: false});
  }

  render () {
    let realCount = 0;
    let suspiciousCount = 0;
    const token = localStorage.getItem('rtc-token');
    let refreshButton = this.state.isSearching?<Loader />:(
      <i className="fa fa-sync" aria-hidden="true"
        onClick={this.handleRefresh}
      ></i>
    );
    for (let i in this.props.retweeters) {
      if (this.props.retweeters[i].analysis.classification === 'real') {
        realCount++
      } else if (this.props.retweeters[i].analysis.classification === 'suspicious') {
        suspiciousCount++
      }
    }
    let realPercent = parseInt(this.financial(realCount / this.props.retweeters.length * 100));
    let suspiciousPercent = parseInt(this.financial(suspiciousCount / this.props.retweeters.length * 100));
    if ((realPercent + suspiciousPercent) > 100) {
      suspiciousPercent = 100 - realPercent;
    }
    let botsPercent = 100 - realPercent - suspiciousPercent;
    let adverbText = 'mostly';
    let adjective = '';
    
    // Define which percent is predominant. real or suspicious or bots ?
    let predominantClass = '';
    let suspiciousClass = '';
    if (realPercent >= suspiciousPercent && realPercent >= botsPercent) {
      predominantClass = 'real-color';
      adjective = 'real';
    } else if (suspiciousPercent >= realPercent && suspiciousPercent >= botsPercent) {
      predominantClass = 'suspicious-color';
      suspiciousClass = 'suspicious-text';
      adjective = 'suspicious';
    } else {
      predominantClass = 'bots-color';
      adjective = 'bots';
    }
    
    let resultClasses = ['result-container', 'group', adjective];
    let resultIcon = null;
    switch (adjective){
      case 'real': 
        resultIcon = <i className="far fa-thumbs-up result-icon" aria-hidden="true"></i>;
        break;
      case 'suspicious':
      case 'bots': 
        resultIcon = <i className="far fa-thumbs-down result-icon" aria-hidden="true"></i>;
        break;
      default: 
        resultIcon = null;
    }
  
    let tweetAnalysis = null;
    let analysisLink = '';
    if (this.props.showFull) {
      analysisLink = (
        <a className="analysis-link" href={'/status/' + this.props.retweetId} >View Report</a>
      );
      if (this.props.inRecent !== 'yes') {
        refreshButton = null
        // Change the url of browser
        window.history.pushState("", "", '/status/' + this.props.retweetId)
      }
    } else {
      analysisLink = (
        <a className="analysis-link full-width" href="/login" >View Report</a>
      );
    }

    if (!token) {
      refreshButton = null;
    }
    
    if (this.props.retweeters.length > 0 && this.props.showFull) {
      tweetAnalysis = (
        <div className="anal-inner">
          <h3>Full Retweet Analysis</h3>
          <div className={resultClasses.join(' ')}>
            <div className="chart-description">
              <span className="txt">Retweets</span>
              <span className={`percentage ${predominantClass}`}>{ realPercent }%</span>
              <span className={`classification ${suspiciousClass}`}>{adjective}</span>
            </div>
            <DoughnutChart id={`tweet-${realPercent}-${this.props.id}-analysis-chart`} real={ realPercent } suspicious={ suspiciousPercent } bots={ botsPercent } />
          </div>
          {analysisLink}
        </div>
      );
    } else {
      tweetAnalysis = (
        <div className="anal-inner">
          <h3>Quick Retweet Analysis</h3>
          <div className={resultClasses.join(' ')}>
            <span className="adverb">{adverbText}</span>
            <span className="adjective">{adjective}</span>
            {resultIcon}
          </div>
          {analysisLink}
        </div>
      );
    }
  
    let analysisBoxClasses = ['analysis-box', 'col', 'span-4-of-12', (this.props.showFull?'full':'quick')];
  
    let chevron = this.props.expanded ? <i className="fas fa-chevron-down"></i>:null;
  
    let tweetClasses = ['entry', 'tweet', 'row'];
    if(this.props.expanded) tweetClasses.push('expanded');

    return (
      <div className={tweetClasses.join(' ')}>
        <div className="tweet-content col span-8-of-12">
          <div className="avatar">
            <img src={this.props.avatar} alt="" />
          </div>
          <div className="content">
            {chevron}
            <div className="byline">{this.props.name} <a href={`https://twitter.com/${this.props.username}`} className="username" target="_blank" rel="noopener noreferrer">@{this.props.username}</a> <span className="date">{this.props.tweetDate}</span></div>
            <p className="tweet-txt">{this.props.content}</p>
            <div className="counts">
              <span className="retweets">{this.formatCount(this.props.countRetweets)}</span>
              <span className="likes">{this.formatCount(this.props.countLikes)}</span>
              <span className="refresh-btn">
                {refreshButton}
              </span>
              <span className="search-date">{this.props.searchDate}</span>
              {/* <span className="refresh-btn"><i className="fa fa-sync" aria-hidden="true"></i></span> */}
            </div>
          </div>
        </div>
        <div className={analysisBoxClasses.join(' ')}>
          {tweetAnalysis}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return { recent: state.recent };
}
export default connect(mapStateToProps, { refreshTwitter })(Tweet);