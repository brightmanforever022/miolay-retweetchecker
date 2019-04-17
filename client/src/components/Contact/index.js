import React, { Component } from 'react'
import '../../scss/index.scss'
import '../../App.scss'
import '../../scss/queries.scss'
import Header from '../Header'
import Footer from '../Footer'

class Contact extends Component {

  render() {
    return (
      <div className="App">
        <Header />
        <section className="App-body">
          <h1 className="main-title">Contact</h1>
          <p>This is contact page.</p>
        </section>
        <Footer />
      </div>
    )
  }
}

export default Contact
