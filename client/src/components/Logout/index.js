import React, { Component } from 'react'
import {Redirect} from 'react-router-dom'
import { signoutUser } from '../../actions'
import {connect} from 'react-redux'

class Logout extends Component {
    componentWillMount(){
        this.props.signoutUser()
    }
    render() {
        return <Redirect to="/"/>
    }
}

const mapDispatchToProps = dispatch => ({
    signoutUser: id => dispatch(signoutUser())
})

export default connect(null,mapDispatchToProps)(Logout)
