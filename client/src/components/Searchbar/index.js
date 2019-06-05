import React, { Component } from 'react'

import { connect } from 'react-redux'
import Loader from '../Loader'
import { searchTwitter } from '../../actions/index'

class Searchbar extends Component {
  constructor(props) {
    super(props)
    
    this.state = {
      isSearching: false,
      errorMessage: '',
      searchValue: ''
    }

    this.handleFormSearch = this.handleFormSearch.bind(this)
  }

  inputKeypress = (event) => {
    if (event.key === 'Enter') {
       this.handleFormSearch(event)
       event.target.value = ''
    } else {
      let searchValue = event.target.value + event.key
      this.setState({ searchValue: searchValue })
    }
  }

  setSearchValue = (event) => {
    let searchValue = event.key?event.target.value + event.key:event.target.value
    this.setState({ searchValue: searchValue })
  }

  handleFormSearch(e) {
    let searchValue = this.state.searchValue
    if (searchValue !== '') {
      if (searchValue.indexOf('status/') !== -1) {
        this.setState({ isSearching: true, errorMessage: '', searchValue: ''})
        this.props.searchTwitter(searchValue)
      } else {
        this.setState({ errorMessage: 'We support only searching of retweet' })
      }
    }else {
      this.setState({ errorMessage: 'Must enter valid search terms' })
    }
  }
  componentWillReceiveProps(nextProps) {
    const { recent } = nextProps
    if (recent.error) {
      this.setState({ isSearching: false, errorMessage: 'Sorry, looks like that tweet doesn\'t exist' })
    } else {
      console.log('search recent: ', recent)
      this.setState({ isSearching: false })
      if (recent.searchResult) {
        let tweetContent = recent.searchResult.tweet.content
        document.title = '"' + tweetContent.substring(0, 18) + '" | Retweet Checker'
        document.getElementsByTagName("meta")[2].content = nextProps.recent.searchResult.tweet.user.name + ' - ' + tweetContent.substring(0, 38) + ' | Are These Retweets Real?'
      }
    }
  }

  render(){
    let loader = this.state.isSearching ? <Loader /> : null
    return (
      <div className="search-container">
        <div className="row">
          <div className="input-field col span-9-of-12">
            {/*<span className="at-symbol">&#64;</span>*/}
            { loader }
            <input type="text" placeholder="Enter the link to the tweet you want to checked" onKeyPress={this.inputKeypress} onChange={this.setSearchValue} />
          </div>
          <button className="col span-3-of-12" onClick={this.handleFormSearch}><span className="icon"></span> Check</button>
        </div>
        <div className="row">
          <div className="error-message col span-9-of-12">{this.state.errorMessage}</div>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return { recent: state.recent }
}

export default connect(mapStateToProps, { searchTwitter })(Searchbar)
