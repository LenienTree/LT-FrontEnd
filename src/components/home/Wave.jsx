import React from "react";

const Wave = ({ className, style }) => (
  <div
    className={`absolute bg-green-200/5 rounded-[100%] ${className}`}
    style={style}
  />
);

export default Wave;
