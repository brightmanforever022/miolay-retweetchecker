import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css'

import Header from './components/Header/Header';
import Home from './components/Home';
import Profile from './components/Profile';
import Footer from './components/Footer';

class App extends Component {
  render() {
    return (
      <div className="App">
        <Header />
        <Home />
        <Footer />
      </div>
    );
  }
}

export default App;
