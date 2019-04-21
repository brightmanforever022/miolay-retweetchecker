import React, { Component } from 'react'
import { connect } from 'react-redux'

import DoughnutChart from '../DoughnutChart/DoughnutChart'

class Report extends Component {

  financial = (x) => {
    return Number.parseFloat(x).toFixed(0)
  }

  formatCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M'
    } else if(count >= 1000) {
      return (count / 1000).toFixed(1) + 'k'
    }
    return count
  }
  reformatDateString = (str) => {
    var date = str.split('T')[0]
    return date
  }
  lengthenIntFromAbbrString = function(str) {
    str = str.toString()
    switch (true) {
      case str.indexOf('k') >= 0:
        str = str.replace('k', '')
        str = str * 1000
        break
      case str.indexOf('m') >= 0:
        str = str.replace('m', '')
        str = str * 1000000
        break
      case str.indexOf('b') >= 0:
        str = str.replace('b', '')
        str = str * 1000000000
        break
      default:
        str = 0
    }
    return parseInt(str)
  }

  analyzeRetweeters = function(retweeters, tweetData) {
    var realRetweeterFollowerCounts = []
    var analysis = {
      classification: null,
      majorityPercentage: null,
      percentages: {
        real: null,
        suspicious: null,
        bots: null,
      },
      _total_analyzed: 0,
      _suspicious_total: 0,
      _suspicious_mass_retweeters: 0,
      _suspicious_mass_followers: 0,
      _suspicious_account: 0,
      _real_total: 0,
      _real_influencers : 0,
      _real_regular: 0,
      _bots_total: 0,
      _bots_activity: 0,
      _bots_account: 0,
      _bots_account_and_activity: 0,
    }

    if (tweetData && typeof tweetData.counts !== 'undefined') {
      analysis.counts = {
        retweets: this.lengthenIntFromAbbrString(tweetData.counts.retweets),
        likes: this.lengthenIntFromAbbrString(tweetData.counts.likes),
      }
    }

    for ( var i in retweeters ) {
      analysis._total_analyzed ++
      if (retweeters[i].analysis.classification === 'real') {
        analysis._real_total ++
        realRetweeterFollowerCounts.push(retweeters[i].followedBy)
        switch (retweeters[i].analysis.justification.slug) {
          case 'influencer': analysis._real_influencers ++
            break
          case 'regular':
          default: 
            analysis._real_regular ++
        }
      }
      if (retweeters[i].analysis.classification === 'suspicious') {
        analysis._suspicious_total ++
        switch (retweeters[i].analysis.justification.slug) {
          case 'highRetweetRatio': analysis._suspicious_mass_retweeters ++
            break
          case 'highFollowerRatio': analysis._suspicious_mass_followers ++
            break
          case 'highThreatLevel':
          default: analysis._suspicious_account ++
            break
        }
      }
      if (retweeters[i].analysis.classification === 'bots') {
        analysis._bots_total ++
        switch (retweeters[i].analysis.justification.slug) {
          case 'account': analysis._bots_account ++
            break
          case 'activity': analysis._bots_activity ++
            break
          case 'accountAndActivity':
          default:
            analysis._bots_account_and_activity ++
        }
      }
    }

    var classes = []
    classes[analysis._real_total] = 'real'
    classes[analysis._suspicious_total] = 'suspicious'
    classes[analysis._bots_total] = 'bots'
    analysis.classification = classes.pop()

    // Set majority percentage
    analysis.percentages.real = Math.round( ( analysis._real_total / analysis._total_analyzed ) * 100 )
    analysis.percentages.suspicious = Math.round( ( analysis._suspicious_total / analysis._total_analyzed ) * 100 )
    analysis.percentages.bots = Math.round( ( analysis._bots_total / analysis._total_analyzed ) * 100 )
    analysis.majorityPercentage = analysis.percentages[analysis.classification]

    var sum = 0, avg
    for ( var z in realRetweeterFollowerCounts) sum += realRetweeterFollowerCounts[z]

    avg = Math.round(sum / realRetweeterFollowerCounts.length)

    // Generate estimates
    analysis.estimates = {
      realRetweeterAverageFollowerCount: avg,
    }

    return analysis
  }

  generateEstimatesViaAnalysis = function(analysis, userProbablityMatrix) {
    analysis.estimates.actualFollowerCount = userProbablityMatrix.followedBy
    analysis.estimates.estimatedFollowerCount = Math.round(userProbablityMatrix.followedBy * (analysis.percentages.real * .01))
    if (analysis.counts) {
      analysis.estimates.actualRetweetersCount = analysis.counts.retweets
      analysis.estimates.actualRetweetersReach = analysis.counts.retweets * analysis.estimates.realRetweeterAverageFollowerCount
      analysis.estimates.estimatedRetweetersCount = Math.round(analysis.counts.retweets * (analysis.percentages.real * .01))
      analysis.estimates.estimatedRetweetersReach = analysis.estimates.estimatedRetweetersCount * analysis.estimates.realRetweeterAverageFollowerCount
      analysis.estimates._actualQualityReachWithFakes = analysis.estimates.actualFollowerCount + analysis.estimates.actualRetweetersReach
      analysis.estimates._estimatedQualityReach = analysis.estimates.estimatedFollowerCount + analysis.estimates.estimatedRetweetersReach
    }
    return analysis.estimates
  }

  render() {

    const { recent } = this.props
    const retweetersJSX = []
    const analysis = this.analyzeRetweeters(recent.retweeters, recent.searchResult.tweet)
    const estimates = this.generateEstimatesViaAnalysis(analysis, recent.searchResult.probabilityMatrix)
    let totalLength = recent.retweeters.length
    let realCount = 0, realRegularCount = 0, realInfluencerCount = 0, suspicious = 0, highRetweetRatio = 0, highFollowerRatio = 0, highThreatLevel = 0
    let bots = 0, botsAccount = 0, botsActivity = 0, accountAndActivity = 0
    for ( let i in recent.retweeters ) {
      let linkClasses = ['avatar']
      linkClasses.push(recent.retweeters[i].analysis.classification)
      linkClasses.push(recent.retweeters[i].analysis.justification.slug)
      retweetersJSX.push(
        <a key={i} className="retweeter-link" href={"https://twitter.com/" + recent.retweeters[i].screenName} target="_blank" rel="noopener noreferrer">
          <img src={recent.retweeters[i].profileImageUrl} title="" className={linkClasses.join(' ')} alt="" />
        </a>
      )
      // Calculate percents of each category
      if (recent.retweeters[i].analysis.classification === 'real') {
        realCount++
        if (recent.retweeters[i].analysis.justification.slug === 'regular') {
          realRegularCount++
        } else {
          realInfluencerCount++
        }
      } else if (recent.retweeters[i].analysis.classification === 'suspicious') {
        suspicious++
        if (recent.retweeters[i].analysis.justification.slug === 'highRetweetRatio') {
          highRetweetRatio++
        } else if (recent.retweeters[i].analysis.justification.slug === 'highFollowerRatio') {
          highFollowerRatio++
        } else {
          highThreatLevel++
        }
      } else { // Bots
        bots++
        if (recent.retweeters[i].analysis.justification.slug === 'account') {
          botsAccount++
        } else if (recent.retweeters[i].analysis.justification.slug === 'activity') {
          botsActivity++
        } else {
          accountAndActivity++
        }
      }
    }
    let realPercent = parseInt(this.financial(realCount / totalLength * 100))
    let suspiciousPercent = parseInt(this.financial(suspicious / totalLength * 100))
    if ((realPercent + suspiciousPercent) > 100) {
      suspiciousPercent = 100 - realPercent
    }
    let botsPercent = 100 - realPercent - suspiciousPercent
    let reportText = null
    if (realPercent >= 70) {
      reportText = (
        <div>
          <p>{recent.searchResult.tweet.user.screenName}'s retweets on this tweet were mostly real, with {analysis.percentages.real}% real retweets, and has an impressive Quality Reach of {this.formatCount(analysis.estimates._estimatedQualityReach)} users.</p>
          <p>Now, to be more detailed, here's what we did:<br />
          We analyized {recent.searchResult.tweet.user.screenName}'s tweet from {recent.searchResult.tweet.date} to verify if his retweets were real or FAKE. When we last checked on {recent.searchResult.updatedAt.substr(0,10).replace(/-/g, '/')}, {recent.searchResult.tweet.user.screenName} had {recent.searchResult.tweet.counts.retweets} retweets, of which {analysis.percentages.real}% were real, or about {Math.floor(recent.searchResult.tweet.counts.retweets * analysis.percentages.real / 100)} retweets. We discovered only about {analysis.percentages.suspicious + analysis.percentages.bots}% of retweets where either suspecious or fake. This assessment is very good based on what we normally see.</p>
          <p>In terms of exposure and reach, {recent.searchResult.tweet.user.screenName} tweet potentially reached both his and his real retweeter's active followers. We call this Quality Reach because we don't count users that won't see it, such as fake, inactive, and suspecious users. Our analysis of {recent.searchResult.tweet.user.screenName} followers determined that about {analysis.percentages.bots}% of their followers are fake or inactive, leaving about {analysis.estimates.actualFollowerCount} of real active followers. The {Math.floor(recent.searchResult.tweet.counts.retweets * analysis.percentages.real / 100)} real users that retweeted this tweet have approximately {analysis.estimates.realRetweeterAverageFollowerCount} followers each on average. So a bit a math gives us their Quality Reach of {this.formatCount(analysis.estimates._estimatedQualityReach)} users.</p>
        </div>
      )
    } else if (realPercent >= 50) {
      reportText = (
        <div>
          <p>{recent.searchResult.tweet.user.screenName}'s retweets on this tweet were only {analysis.percentages.real}% real, with {analysis.percentages.bots}% of retweets being fake and another {analysis.percentages.suspicious}% of retweets coming from suspecious users. With those figures, {recent.searchResult.tweet.user.screenName}'s tweet was able to Reach {this.formatCount(analysis.estimates._estimatedQualityReach)} real and active Twitter users.</p>
          <p>To be more precises, here's how we came to our conclusions:<br />
          We analyized {recent.searchResult.tweet.user.screenName}'s tweet from {recent.searchResult.tweet.date} to verify if his retweets were real or FAKE. When we last checked on {recent.searchResult.updatedAt.substr(0,10).replace(/-/g, '/')}, {recent.searchResult.tweet.user.screenName} had {recent.searchResult.tweet.counts.retweets} retweets, of which {analysis.percentages.real}% were real, or about {Math.floor(recent.searchResult.tweet.counts.retweets * analysis.percentages.real / 100)} retweets. We discovered that {analysis.percentages.suspicious + analysis.percentages.bots}% of retweets where either suspecious or fake. This assessment is definitely below average based on what we normally see, but it's not terrible.</p>
          <p>In terms of exposure and reach, {recent.searchResult.tweet.user.screenName} tweet potentially reached both his and his real retweeter's active followers. We call this Quality Reach because we don't count users that won't see it, such as fake, inactive, and suspecious users. Our analysis of {recent.searchResult.tweet.user.screenName} followers determined that about {analysis.percentages.bots}% of their followers are fake or inactive, leaving about {analysis.estimates.actualFollowerCount} of real active followers. The {Math.floor(recent.searchResult.tweet.counts.retweets * analysis.percentages.real / 100)} real users that retweeted this tweet have approximately {analysis.estimates.realRetweeterAverageFollowerCount} followers each on average. After working out some math, the tweet had a Quality Reach of about {this.formatCount(analysis.estimates._estimatedQualityReach)} users.</p>
        </div>
      )
    } else {
      reportText = (
        <div>
          <p>{recent.searchResult.tweet.user.screenName}'s tweet had {recent.searchResult.tweet.counts.retweets} retweets, of which {analysis.percentages.bots + analysis.percentages.suspicious}% were fake or suspecious. There were only {analysis.percentages.real}% real retweets, which is well below-average. With about {Math.floor(recent.searchResult.tweet.counts.retweets * analysis.percentages.real / 100)} real retweets, {recent.searchResult.tweet.user.screenName}'s tweet was only able to Reach {this.formatCount(analysis.estimates._estimatedQualityReach)} real and active Twitter users.</p>
          <p>To be more precises, here's how we came to our conclusions:<br />
          We analyized {recent.searchResult.tweet.user.screenName}'s tweet from {recent.searchResult.tweet.date} to verify if his retweets were real or FAKE. When we last checked on {recent.searchResult.updatedAt.substr(0,10).replace(/-/g, '/')}, {recent.searchResult.tweet.user.screenName} had {recent.searchResult.tweet.counts.retweets} retweets, of which {analysis.percentages.real}% were real, or about {Math.floor(recent.searchResult.tweet.counts.retweets * analysis.percentages.real / 100)} retweets. We discovered that {analysis.percentages.suspicious + analysis.percentages.bots}% of retweets where either suspecious or fake, which is much higher than it should be. Our analysis revealed that MOST of the retweets were fake or from suspecious users, which may lead some to question if {recent.searchResult.tweet.user.screenName} bought fake retweets for this tweet, or could be getting spammed with fake retweets.</p>
          <p>In terms of exposure and reach, we'd normally see a much bigger number than {this.formatCount(analysis.estimates._estimatedQualityReach)} Quality Reach, considering the tweet had {recent.searchResult.tweet.counts.retweets} retweets. However, with about {Math.floor(recent.searchResult.tweet.counts.retweets * (analysis.percentages.bots + analysis.percentages.suspicious) / 100)} being fake, inactive or suspecious, the number of users that would actually see their tweet is much lower. We calculated this by looking at both {recent.searchResult.tweet.user.name}'s real followers and the real retweets received. Our analysis of {recent.searchResult.tweet.user.screenName} followers determined that about {analysis.percentages.bots}% of their followers are fake or inactive, leaving about {analysis.estimates.actualFollowerCount} of real active followers. The {Math.floor(recent.searchResult.tweet.counts.retweets * analysis.percentages.real / 100)} real users that retweeted this tweet have an average of {analysis.estimates.realRetweeterAverageFollowerCount} followers each. Crunching those numbers, we see that the tweet has a {this.formatCount(analysis.estimates._estimatedQualityReach)} Quality Reach.</p>
        </div>
      )
    }

    return (
      <div className="retweet-report row">
        <div className="retweeters-breakdown row">
          <div className="col span-5-of-12 col-capture-roof">
            <div className="capture-roof">
              <h3>Most Recent Retweeters</h3>
              {retweetersJSX}
            </div>
          </div>
          <div className="col span-3-of-12 col-retweeter-analysis">
            <div className="retweeter-analysis">
            <h3>Retweeter Analysis</h3>
              <div className="real-people">
                <ul className="captures">
                  <li className="capture real">
                    <div className="text-left">
                      <p>Real People</p>
                    </div>
                    <div className="text-right">
                      <span>{this.financial(realCount / totalLength * 100)}%</span>
                    </div>
                  </li>
                  <li className="capture real regular">
                    <div className="text-left">
                      <p>Regular Joes</p>
                    </div>
                    <div className="text-right">
                      <span>{this.financial(realRegularCount / totalLength * 100)}%</span>
                    </div>
                  </li>
                  <li className="capture real influencer">
                    <div className="text-left">
                      <p>Influencers</p>
                    </div>
                    <div className="text-right">
                      <span>{this.financial(realInfluencerCount / totalLength * 100)}%</span>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="suspicious-users">
                <ul className="captures">
                  <li className="capture suspicious">
                    <div className="text-left">
                      <p>Suspicious<span className="hide-sm"> Users</span></p>
                    </div>
                    <div className="text-right">
                      <span>{this.financial(suspicious / totalLength * 100)}%</span>
                    </div>
                  </li>
                  <li className="capture suspicious highRetweetRatio">
                    <div className="text-left">
                      <p>Mass Retweeters</p>
                    </div>
                    <div className="text-right">
                      <span>{this.financial(highRetweetRatio / totalLength * 100)}%</span>
                    </div>
                  </li>
                  <li className="capture suspicious highFollowerRatio">
                    <div className="text-left">
                      <p>Mass Followers</p>
                    </div>
                    <div className="text-right">
                      <span>{this.financial(highFollowerRatio / totalLength * 100)}%</span>
                    </div>
                  </li><li className="capture suspicious highThreatLevel">
                  <div className="text-left">
                    <p>Account / Activity</p>
                  </div>
                  <div className="text-right">
                    <span>{this.financial(highThreatLevel / totalLength * 100)}%</span>
                  </div>
                </li>
                </ul>
              </div>
              <div className="bots">
                <ul className="captures">
                  <li className="capture bots">
                    <div className="text-left">
                      <p>Bots</p>
                    </div>
                    <div className="text-right">
                      <span>{this.financial(bots / totalLength * 100)}%</span>
                    </div>
                  </li>
                  <li className="capture bots account">
                    <div className="text-left">
                      <p>Account</p>
                    </div>
                    <div className="text-right">
                      <span>{this.financial(botsAccount / totalLength * 100)}%</span>
                    </div>
                  </li>
                  <li className="capture bots activity">
                    <div className="text-left">
                      <p>Activity</p>
                    </div>
                    <div className="text-right">
                      <span>{this.financial(botsActivity / totalLength * 100)}%</span>
                    </div>
                  </li>
                  <li className="capture bots accountAndActivity">
                    <div className="text-left">
                      <p>Both</p>
                    </div>
                    <div className="text-right">
                      <span>{this.financial(accountAndActivity / totalLength * 100)}%</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="col span-4-of-12 col-doughnut">
            <DoughnutChart id={`tweet-${realPercent}-${suspiciousPercent}-${botsPercent}-report-chart`} real={ realPercent } suspicious={ suspiciousPercent } bots={ botsPercent } />
          </div>
        </div>
        <div className="boxes">
          <div className="col box span-6-of-12">
            <div className="box-inner">
              <h3>Quality Reach</h3>
              <span className="count">{this.formatCount(estimates._estimatedQualityReach)}</span>
              <p>Compared to {this.formatCount(estimates._actualQualityReachWithFakes)} reach including suspicious &amp; fake activity</p>
            </div>
          </div>
          {/* <div className="col box span-4-of-12">
            <div className="box-inner">
              <h3>Retweeting Followers</h3>
              <span className="count">45%</span>
              <p>Compared to 69% avg of all tweets checked</p>
            </div>
          </div> */}
          <div className="col box last span-6-of-12">
            <div className="box-inner">
              <h3>Retweeting Likers</h3>
              <span className="count">60.2%</span>
              <p>Compared to 45% avg of all tweets checked</p>
            </div>
          </div>
        </div>
        <div className="message-copy">
          {reportText}
        </div>
      </div>
    )
  }
}

// export default Report

const mapStateToProps = state => {
  return {
    loggedIn: state.auth.authenticated,
    recent: state.recent
  }
}

export default connect(mapStateToProps, null)(Report)
