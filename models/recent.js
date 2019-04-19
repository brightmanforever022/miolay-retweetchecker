'use strict'

const recent = function (db) {

  const _this = this

  this.id           = null
  this.type         = null
  this.numberofRetweetAndFavorite = 0
  this.checkType    = 'quick'
  this.search       = null
  this.result       = null

  this.findAll = () => {
    return db.find('recent', {}, { updatedAt: -1 }, 10)
  }

  this.find = id => {
    return db.find('recent', { _id: id })
  }

  this.save = () => {
    let dataFromSearch = _this.get()
    dataFromSearch.result.updatedAt = new Date()
    let isExist = false
    return db.find('recent', {}, { updatedAt: -1 }, 10).then(recentHistory => {
      if (recentHistory.length > 0) {
        recentHistory.forEach(recentItem => {
          if (recentItem.search == dataFromSearch.search) {
            isExist = true
          }
        })
        if (!isExist && dataFromSearch.checkType == 'full') {
          return db.save('recent', dataFromSearch)
        } else if (isExist && dataFromSearch.checkType === 'full') {
          return db.update('recent', { search: dataFromSearch.search }, dataFromSearch)
        } else {
          return dataFromSearch
        }
      } else {
        if (dataFromSearch.checkType == 'full') {
          return db.save('recent', dataFromSearch)
        } else {
          return dataFromSearch
        }
      }
    })
  }

  // remove any items older than 10 days
  this.clean = () => {
    const lessThan = new Date()
    lessThan.setDate(lessThan.getDate() - 10)
    return db.remove('recent', { updatedAt: { '$lt':  lessThan }})
  }

  this.get = () => {
    return {
      // _id: _this.id,
      type: _this.type,
      numberofRetweetAndFavorite: _this.numberofRetweetAndFavorite,
      checkType: _this.checkType,
      search: _this.search,
      result: _this.result,
      updatedAt: (new Date())
    }
  }

}

module.exports = db => {
  return new recent(db)
}
