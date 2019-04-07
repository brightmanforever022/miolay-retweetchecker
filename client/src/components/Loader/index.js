import React from 'react';
import './Loader.scss';

const loader = (props) => {
  
  return (
    <div className="loading row">
      <div className="ballwrap">
        <div className="ball"></div>
        <div className="ball"></div>
        <div className="ball"></div>
        <div className="ball"></div>
        <div className="ball"></div>
        <div className="ball"></div>
        <div className="ball"></div>
      </div>
    </div>
  );
};

export default loader;