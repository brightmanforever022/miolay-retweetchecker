import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';
import { signCallbackHandling } from '../../actions/';
import {connect} from 'react-redux';

class Login extends Component {
    constructor(){
        super();
        this.state = {
            redirect: false
        }
    }
    componentWillMount(){
        const tokens  = this.props.location.search;
        this.props.signCallbackHandling(tokens);
    }
    render() {
        return <div>
            {<Redirect to="/"/>}
        </div>
    }
}

const mapDispatchToProps = dispatch => ({
    signCallbackHandling: tokens => dispatch(signCallbackHandling(tokens))
})

export default connect(null,mapDispatchToProps)(Login);