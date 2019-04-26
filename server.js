// Main starting point of the application
const express    = require('express')
const app        = express()
const cors       = require('cors')
const helmet     = require('helmet')
const session    = require('cookie-session')
const http       = require('http')
const bodyParser = require('body-parser')
const pkgjson    = require('./package.json')
const router     = require('./router')
const path       = require('path')
require('dotenv').config()
var config
if (process.env.NODE_ENV=='development') {
  config = require('./config/dev')
} else {
  config = require('./config/product')
}
console.log('environment: ', process.env.NODE_ENV)
const PORT = process.env.PORT || config.port
// const MONGO_HOST = process.env.MONGO_HOST || config.mongodb.host
// const MONGO_PORT = process.env.MONGO_PORT || config.mongodb.port
// const MONGO_DB = process.env.MONGO_DB || config.mongodb.db

// App Setup (morgan and body-parser are middleware in Express)

app.use(cors())
app.use(session({
	name: 'rtc',
	keys: config.session.keys,
	maxAge: config.session.ttl * 1000,
	httpOnly: false
}))

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', config.originURL)
	req.twitter = require('./lib/twitter')(config.twitter)
	const mongo_uri = process.env.MONGODB_URI || config.mongodbUri
	req.db = require('./lib/db')(mongo_uri)
	if (!req.session.twitterUser) {
		req.session.twitterAccessTokenKey     = config.twitter.oauth1.accessTokenKey
		req.session.twitterAccessTokenSecret  = config.twitter.oauth1.accessTokenSecret
		req.twitter.setUser(config.twitter.oauth1.accessTokenKey, config.twitter.oauth1.accessTokenSecret)
	}
	if (req.session.twitterAccessTokenKey && req.session.twitterAccessTokenSecret) {
		req.twitter.setUser(req.session.twitterAccessTokenKey, req.session.twitterAccessTokenSecret, req.session.twitterUser)
	} else {
		req.twitter = null
	}
	app.locals = {
		session: req.session,
		config: config,
		version: process.env.NODE_ENV === 'development' ? Math.floor(new Date() / 1000) : pkgjson.version
	}
	next()
})

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json({
  type: '*/*'
})) // middleware for helping parse incoming HTTP requests

app.use(helmet())

// Router Setup
router(app)

// //Static file declaration
app.use(express.static(__dirname, { dotfiles: 'allow' }))

// production mode
if(process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build'), { dotfiles: 'allow' }))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/client/build/index.html'))
  })
}
// //build mode
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/client/public/index.html'))
})

// Server Setup
const server = http.createServer(app)
server.listen(PORT, () => {
  console.log('TwitterCheck listening on: ', PORT)
})

var pingdom = setInterval(function() {
  http.get(config.originURL + '/api/')
}, 900000)