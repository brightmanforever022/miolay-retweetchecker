import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import reduxThunk from 'redux-thunk';

import Home from './components/Home';
// import Profile from './components/Profile';
import Status from './components/Status';
import Login from './components/Login';
import LoginCallback from './components/Login/loginCallback';
import Logout from './components/Logout';
import About from './components/About';
import Contact from './components/Contact';
import Sitemap from './components/Sitemap';

import reducers from './reducers';
import { AUTH_USER } from './actions/types';

const createStoreWithMiddleware = applyMiddleware(reduxThunk)(createStore);
const store = createStoreWithMiddleware(reducers);

const token = localStorage.getItem('rtc-token');
const username = localStorage.getItem('user_name');
const image = localStorage.getItem('user_avatar');
// If we have a token, consider the user to be signed in
if (token) {
  // We need to update application state
  store.dispatch({ type: AUTH_USER, payload:{username,image} });
}

ReactDOM.render(
  <Provider store={store}>
    <Router>
      <div className="App">
        <Switch>
          <Route exact path='/' component={Home} />
          <Route exact path='/login' component={Login} />
          <Route exact path='/login/callback' component={LoginCallback} />
          <Route exact path='/logout' component={Logout} />
          <Route exact path='/about' component={About} />
          <Route exact path='/contact' component={Contact} />
          <Route exact path='/sitemap.xml' component={Sitemap} />
          {/*<Route path="/profile/:search" component={Profile} />*/}
          <Route path="/status/:search" component={Status} />
          <Route path="**" component={Home} />
        </Switch>
      </div>
    </Router>
  </Provider>
  , document.getElementById('root')
);
