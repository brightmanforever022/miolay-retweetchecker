import React, { Component } from 'react'
import '../../scss/index.scss'
import '../../App.scss'
import '../../scss/queries.scss'

class EchoKey extends Component {

  render() {
    let keyText = "v6WjfaIvbLhL0kCRmpwxcXwj2Vy0gUIlcgknJndTc9o.EqAY2MwUTFFakty8jFLcY8eSo-7N_6Pk5TUHUj10I2Q"
    return (
      <section className="App-body">
        { keyText }
      </section>
    )
  }
}

export default EchoKey
