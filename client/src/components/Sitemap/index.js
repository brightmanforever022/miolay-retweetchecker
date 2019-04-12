import React, { Component } from 'react';
import { connect } from 'react-redux';
import Loader from '../Loader';
import { getSitemap } from '../../actions/index';

import '../../scss/index.scss';
import '../../App.scss';
import '../../scss/queries.scss';

class Sitemap extends Component {

  constructor(props) {
    super(props);
    
    this.state = {
      isSearching: true
    };
  }

  componentWillReceiveProps (nextProps) {
    this.setState({isSearching: false});
  }

  render() {
    let sitemapText = this.state.isSearching ? <Loader /> : this.props.sitemap
    return (
      <section className="App-body">
          <h1 className="main-title">Sitemap</h1>
          { sitemapText }
      </section>
    );
  }
}

function mapStateToProps(state) {
  return { sitemap: state.sitemap };
}
export default connect(mapStateToProps, { getSitemap })(Sitemap);