import React, { Component } from 'react';
import {connect} from 'react-redux';
import logo from '../../logo.svg';

class Header extends Component {

  state = {
    activeNavItem: 'checker',
    //loggedIn: true,
    showDropdown: false
  };
  
  componentDidMount() {
    const path = document.location.href;
    if (path.indexOf('about') !== -1) {
      this.setState({activeNavItem: 'about'});
    } else if (path.indexOf('contact') !== -1) {
      this.setState({activeNavItem: 'contact'});
    } else {
      this.setState({activeNavItem: 'checker'});
    }
  }
  
  toggleDropdown = (e) => {
    e.preventDefault();
    this.setState({showDropdown: !this.state.showDropdown});
  };

  render(){
    // Navigation Active Item Selection
    /*
    const asterisk = <span className="asterisk">&#42;</span>;
    const liClassesChecker = 'nav-item' + (this.state.activeNavItem === 'checker' ? ' active':'');
    const liClassesAbout = 'nav-item' + (this.state.activeNavItem === 'about' ? ' active':'');
    const liClassesContact = 'nav-item' + (this.state.activeNavItem === 'contact' ? ' active':'');
    const asterisks = {
      checker : (this.state.activeNavItem === 'checker' ? asterisk : null),
      about : (this.state.activeNavItem === 'about' ? asterisk : null),
      contact : (this.state.activeNavItem === 'contact' ? asterisk : null)
    };
    */
    // Login / User Dropdown
    let userControls = <a href="/login" className="login-btn">Login</a>;
    if(this.props.loggedIn) {
      const dropdown = this.state.showDropdown ? (<ul className="dropdown">
        <li><a href="/settings"><i className="fas fa-cog"></i> Settings</a></li>
        <li><a href="/logout"><i className="fas fa-sign-out-alt"></i> Logout</a></li>
      </ul>) : null;
      userControls = (
        <div>
          <button className="btn-dropdown" onClick={this.toggleDropdown}><img src={this.props.image} className="avatar" alt="" /> <span className="my-username">@{this.props.username}</span></button>
          {dropdown}
        </div>
      );
    }

    return (
      <header className="App-header row">
        <a href="/"><img src={logo} className="App-logo col span-3-of-12" alt="logo" /></a>
        <div className="col span-9-of-12 App-nav-holder">
          {/* <nav className="App-nav">
            <ul>
              <li><a href="/" className={liClassesChecker}>Checker{asterisks['checker']}</a></li>
              <li><a href="/about" className={liClassesAbout}>About{asterisks['about']}</a></li>
              <li><a href="/contact" className={liClassesContact}>Contact{asterisks['contact']}</a></li>
            </ul>
          </nav> */}
          <div className="user-controls">
            {userControls}
          </div>
        </div>
      </header>
    );
  }
}

const mapStateToProps = state =>{
  return {
    loggedIn: state.auth.authenticated,
    username: state.auth.username,
    image: state.auth.image
  }
};

export default connect(mapStateToProps)(Header);