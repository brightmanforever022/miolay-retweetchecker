import React, { Component } from 'react';
import '../../scss/index.scss';
import '../../App.scss';
import '../../scss/queries.scss';

class About extends Component {

  render() {
    return (
      <section className="App-body">
          <h1 className="main-title">About Twitterchecker</h1>
          <p>
              This is about page.
          </p>
      </section>
    );
  }
}

export default About;
