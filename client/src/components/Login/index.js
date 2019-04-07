import React, { Component } from 'react';
import {connect} from 'react-redux';
import {Route } from 'react-router-dom';
import {signinUser} from '../../actions';

class Login extends Component {
    componentDidMount(){
        this.props.signinUser();
    }
    render() {
        return <div style={{color:"#fff"}}>
            {this.props.redirect?<Route path='/login' component={() => window.location = this.props.redirect}/>:null}
        </div>
    }
}

const mapStateToProps = state =>{
    return {
        redirect: state.auth.redirect 
    }
};

const mapDispatchToProps = dispatch => ({
    signinUser: () => dispatch(signinUser())
})

export default connect(mapStateToProps, mapDispatchToProps)(Login);