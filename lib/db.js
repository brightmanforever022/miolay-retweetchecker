'use strict'

const mongodb = require('mongodb').MongoClient
const Promise = require('bluebird')

const db = function (mongo_uri) {

  const _this       = this
  const MAX_RESULTS = 1000

  this.connect = () => {
    return new Promise((resolve, reject) => {
      // mongodb.connect('mongodb://' + host + ':' + port + '/' + dbname, (error, db) => {
      mongodb.connect(mongo_uri, (error, db) => {
        if (error) return reject(error)
        return resolve(db)
      })
    })
  }

  this.find = (collection, query, sort, limit) => {
    return _this.connect().then((db) => {
      return new Promise((resolve, reject) => {
        const col = db.collection(collection)
        col.find(query).sort(sort ? sort : {}).limit(limit ? limit : MAX_RESULTS).toArray((error, docs) => {
          db.close()
          if (error) return reject(error)
          return resolve(docs)
        })
      })
    })
  }

  this.findOnly = (collection, query, fields, sort, limit) => {
    return _this.connect().then((db) => {
      return new Promise((resolve, reject) => {
        const col = db.collection(collection)
        col.find(query, fields).sort(sort ? sort : {}).limit(limit ? limit : MAX_RESULTS).toArray((error, docs) => {
          db.close()
          if (error) return reject(error)
          return resolve(docs)
        })
      })
    })
  }

  this.save = (collection, record) => {
    return _this.connect().then((db) => {
      return new Promise((resolve, reject) => {
        const col = db.collection(collection)
        col.save(record, (error, result) => {
          db.close()
          if (error) return reject(error)
          return resolve(record)
        })
      })
    })
  }

  this.update = (collection, query, record) => {
    return _this.connect().then((db) => {
      return new Promise((resolve, reject) => {
        const col = db.collection(collection)
        col.update(query, record, (error, result) => {
          db.close()
          if (error) return reject(error)
          return resolve(record)
        })
      })
    })
  }

  this.remove = (collection, query) => {
    return _this.connect().then(db => {
      return new Promise((resolve, reject) => {
        const col = db.collection(collection)
        col.remove(query, (error, result) => {
          db.close()
          if (error) return reject(error)
          return resolve(result)
        })
      })
    })
  }

}

module.exports = (mongo_uri) => {
  return new db(mongo_uri)
}
