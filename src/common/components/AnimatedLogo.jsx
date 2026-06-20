import React from "react";
import "./AnimatedLogo.css";
import netpinLogo from "../../../icons/gemini-svg.svg";

export default function AnimatedLogo({
  size = "md",
  darkMode = false,
  className = "",
}) {
  // size can be 'sm', 'md', 'lg', 'xl'
  const sizeClass = size === "md" ? "" : `logo-animated--${size}`;
  const darkClass = darkMode ? "logo-animated--dark" : "";

  return (
    <div className={`logo-animated ${sizeClass} ${darkClass} ${className}`}>
      <div className="logo-animated__ring logo-animated__ring--1"></div>
      <div className="logo-animated__ring logo-animated__ring--2"></div>
      <div className="logo-animated__ring logo-animated__ring--3"></div>
      <div className="logo-animated__icon">
        <img src={netpinLogo} alt="NetPin Logo" />
      </div>
    </div>
  );
}
