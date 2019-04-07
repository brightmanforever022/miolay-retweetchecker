import React, { Component } from 'react';

class TeaserBlock extends Component {

  state = {
    isSearching: true,
    searchTerm: null
  };

  render(){
    return (
      <div className="teaser-block row">
        <h1>See the full results</h1>
        <p>Authenticate with Twitter to give us the POWER to check more in detail for you</p>
        <h3>Totally free and anonymous check.</h3>
        <a href="/login">Run Full Analysis</a>
      </div>
    );
  }
}

export default TeaserBlock;