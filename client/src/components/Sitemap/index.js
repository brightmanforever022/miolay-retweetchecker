import React, { Component } from 'react';
import { connect } from 'react-redux';
import { fetchSitemap } from '../../actions/index';

import '../../scss/index.scss';
import '../../App.scss';
import '../../scss/queries.scss';

class Sitemap extends Component {

  constructor(props) {
    super(props)
    
    this.state = {
      isSearching: true
    }
  }

  componentWillMount() {
    this.props.fetchSitemap()
  }
  componentWillReceiveProps (nextProps) {
    this.setState({isSearching: false})
  }

  render() {
    let sitemapText = this.props.sitemap.sitemap
    return (
      <section className="App-body">
        { sitemapText }
      </section>
    )
  }
}

function mapStateToProps(state) {
  return { sitemap: state.sitemap }
}
export default connect(mapStateToProps, { fetchSitemap })(Sitemap)
