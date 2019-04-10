const Checker = require('./controllers/checker');
const Profile = require('./controllers/profile');
const Recent = require('./controllers/recent');
const Status = require('./controllers/status');
const Auth = require('./controllers/auth');

// const cors = require('cors');

module.exports = (app) => {
    // API for twitter authentication
    app.get('/api/login', Auth.login);
    app.get('/api/login/callback', Auth.loginCallback);
    app.get('/api/logout', Auth.logout);
    
    // API for checker to get usertimeline from twitter
    app.post('/api/fullChecker', Checker.fullChecker);
    app.post('/api/simpleChecker', Checker.simpleChecker);

    // API for profile
    app.post('/api/profile', Profile.getProfile);

    // API for Recent
    app.get('/api/recent', Recent.getRecent);
    
    // API for Status
    app.post('/api/status', Status.getStatus);

    // sitemap
    app.get('/sitemap.xml', (req, res) => {
        console.log('route sitemap.xml')
    })
};