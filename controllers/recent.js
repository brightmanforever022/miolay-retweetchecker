exports.getRecent = (req, res) => {
  const recent = require('../models/recent')(req.db)
  recent.findAll().then(result => {
    res.send(result)
  }).catch(error => {
    console.error(error)
    res.status(500).json(error)
  })
}
