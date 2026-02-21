import React from "react";

export default function Logo({ size = "default", className = "" }) {
  const sizeClasses = {
    small: "w-8 h-8",
    default: "w-10 h-10", 
    large: "w-16 h-16"
  };

  const iconSizes = {
    small: "w-4 h-4",
    default: "w-5 h-5",
    large: "w-8 h-8"
  };

  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg ${className}`}>
      {/* Orbit360 logo design - orbital rings with center dot */}
      <div className="relative flex items-center justify-center">
        <svg 
          viewBox="0 0 32 32" 
          className={`${iconSizes[size]} text-white`}
          fill="currentColor"
        >
          {/* Central dot */}
          <circle cx="16" cy="16" r="3" fill="white" />
          
          {/* Inner orbital ring */}
          <circle 
            cx="16" 
            cy="16" 
            r="8" 
            fill="none" 
            stroke="white" 
            strokeWidth="1.5"
            opacity="0.8"
          />
          
          {/* Outer orbital ring */}
          <circle 
            cx="16" 
            cy="16" 
            r="13" 
            fill="none" 
            stroke="white" 
            strokeWidth="1"
            opacity="0.6"
          />
          
          {/* Orbital dots/satellites */}
          <circle cx="16" cy="3" r="1.5" fill="white" opacity="0.9" />
          <circle cx="29" cy="16" r="1" fill="white" opacity="0.7" />
          <circle cx="16" cy="29" r="1.5" fill="white" opacity="0.9" />
          <circle cx="3" cy="16" r="1" fill="white" opacity="0.7" />
          
          {/* Additional orbital elements for 360 effect */}
          <circle cx="23" cy="8" r="0.8" fill="white" opacity="0.6" />
          <circle cx="8" cy="23" r="0.8" fill="white" opacity="0.6" />
          <circle cx="8" cy="9" r="0.8" fill="white" opacity="0.6" />
          <circle cx="23" cy="23" r="0.8" fill="white" opacity="0.6" />
        </svg>
      </div>
    </div>
  );
}