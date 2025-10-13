import React from 'react';
import './svg-cloud.css';

const CloudSVGContainer = ({ children }) => {
  return (
    <div className="svg-cloud-container">
      {/* SVG Cloud Shape */}
      <svg
        className="svg-cloud-bg"
        width="100%" 
        height="100%" 
        viewBox="0 0 500 300"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cloud shape with gradient fill */}
        <defs>
          <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e6f3ff" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>
        
        {/* Main cloud path */}
        <path 
          d="M 50,150 
             C 30,110 40,70 90,60 
             C 110,10 200,10 220,60 
             C 290,30 380,70 390,140 
             C 430,140 450,180 430,210 
             C 440,250 380,280 350,260 
             C 310,290 220,290 180,260 
             C 120,290 40,250 50,150 z"
          fill="url(#cloudGradient)"
          stroke="#f0f8ff"
          strokeWidth="5"
        />
      </svg>
      
      {/* Content inside the cloud */}
      <div className="svg-cloud-content">
        {children}
      </div>
    </div>
  );
};

export default CloudSVGContainer;