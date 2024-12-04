import React from "react";
import PropTypes from "prop-types";

const Icons = ({ type, width = 24, height = 24, color = "currentColor" }) => {
  const iconPaths = {
    bell: (
      <path
        fill={color}
        d="M4 19v-2h2v-7q0-2.075 1.25-3.687T10.5 4.2v-.7q0-.625.438-1.062T12 2t1.063.438T13.5 3.5v.7q2 .5 3.25 2.113T18 10v7h2v2zm8 3q-.825 0-1.412-.587T10 20h4q0 .825-.587 1.413T12 22"
      />
    ),
    menu: (
      <path fill={color} d="M3 18v-2h18v2zm0-5v-2h18v2zm0-5V6h18v2z" />
    ),
    user: (
      <path
        fill={color}
        d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4"
      />
    ),
    eye: (
      <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
        <path d="M21.544 11.045c.304.426.456.64.456.955c0 .316-.152.529-.456.955C20.178 14.871 16.689 19 12 19c-4.69 0-8.178-4.13-9.544-6.045C2.152 12.529 2 12.315 2 12c0-.316.152-.529.456-.955C3.822 9.129 7.311 5 12 5c4.69 0 8.178 4.13 9.544 6.045" />
        <path d="M15 12a3 3 0 1 0-6 0a3 3 0 0 0 6 0" />
      </g>
    ),
    file: (
      <path
        fill={color}
        d="M18 22a2 2 0 0 0 2-2V8l-6-6H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2zM13 4l5 5h-5zM7 8h3v2H7zm0 4h10v2H7zm0 4h10v2H7z"
      />
    ),
    temple: (
      <path
        fill={color}
        d="m448 48l-32-16l-32 16l-32-16l-32 16l-32-16l-32 16l-32-16l-32 16l-48-16v256.05h224V424c0 30.93 33.07 56 64 56h12c30.93 0 52-25.07 52-56V32ZM272.5 240l-.5-32h159.5l.5 32Zm-64-80l-.5-32h223.5l.5 32Z"
      />
    ),
    truck: (
      <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="4">
        <path d="M5 10v28a2 2 0 0 0 2 2h11l-3-11l7-2l-1-7l8-4l-2-3l3-5H7a2 2 0 0 0-2 2m38 28V10a2 2 0 0 0-2-2h-3l-4 6l3 5l-9 4l1 8l-7 2l2 7h17a2 2 0 0 0 2-2" />
        <path d="M14.5 18a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3" clipRule="evenodd" />
      </g>
    ),
    // Add additional icons here as needed
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 40 40"
    >
      {iconPaths[type] || <text>Invalid icon</text>}
    </svg>
  );
};

// Prop Types for validation
Icons.propTypes = {
  type: PropTypes.string.isRequired, // Type of the icon to render
  width: PropTypes.number, // Width of the icon
  height: PropTypes.number, // Height of the icon
  color: PropTypes.string, // Color of the icon
};

export default Icons;
