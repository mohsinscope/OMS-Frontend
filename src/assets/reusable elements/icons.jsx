import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

const Icons = ({ type, width = 24, height = 24, color = "currentColor" }) => {
  const [iconContent, setIconContent] = useState(null); // Store the dynamically imported icon content
  const [error, setError] = useState(false); // Track invalid icon types

  useEffect(() => {
    const fetchIcon = async () => {
      try {
        // Dynamically import the icon SVG file
        const icon = await import(`./icons-svg/${type}.svg`);
        const response = await fetch(icon.default);
        const svgText = await response.text();

        // Replace hardcoded `fill` attributes for dynamic color support
        const dynamicSvg = svgText.replace(/fill="[^"]*"/g, `fill="${color}"`);

        // Ensure the SVG has a proper `viewBox` for correct scaling
        const svgWithViewBox = dynamicSvg.includes("viewBox")
          ? dynamicSvg
          : dynamicSvg.replace(
              /<svg/,
              `<svg viewBox="0 0 24 24"` // Default `viewBox` if not provided
            );

        setIconContent(svgWithViewBox); // Update state with modified SVG
        setError(false); // Reset error if type is valid
      } catch (err) {
        console.error(`Icon "${type}" not found in ./icons-svg.`);
        setError(true); // Mark as an invalid icon type
      }
    };

    fetchIcon();
  }, [type, color]);

  // Render fallback if the icon type is invalid
  if (error) {
    return <span style={{ color }}>Invalid icon type: {type}</span>;
  }

  // Render the icon as inline SVG if it's successfully loaded
  return iconContent ? (
    <span
      style={{
        width,
        height,
        display: "inline-block",
        lineHeight: 0, // Prevent extra spacing caused by inline elements
      }}
      dangerouslySetInnerHTML={{ __html: iconContent }} // Inject SVG content directly
    />
  ) : (
    <span>Loading...</span> // Render a loading state while importing
  );
};

Icons.propTypes = {
  type: PropTypes.string.isRequired, // The name of the icon file (without the .svg extension)
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), // Allow both numbers and strings
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), // Allow both numbers and strings
  color: PropTypes.string, // Dynamic color for the icon
};

export default Icons;
