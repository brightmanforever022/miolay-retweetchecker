import React, { Component } from 'react'
import '../../scss/index.scss'
import '../../App.scss'
import '../../scss/queries.scss'
import Header from '../Header'
import Footer from '../Footer'

class About extends Component {

  render() {
    return (
      <div className="App">
        <Header />
        <section className="App-body">
          <h1 className="main-title">About Twitterchecker</h1>
          <p>This is about page.</p>
        </section>
        <Footer />
      </div>
    );
  }
}

export default About
