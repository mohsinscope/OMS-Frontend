// Icons.jsx (Vite)
import React, { useMemo } from "react";
import PropTypes from "prop-types";

// Eagerly import all SVGs in this folder as raw strings
const files = import.meta.glob("./icons-svg/*.svg", { as: "raw", eager: true });

// Build a { name: rawSvg } map, normalized to lowercase
const ICONS_MAP = Object.fromEntries(
  Object.entries(files).map(([path, raw]) => {
    const match = path.match(/\/([^/]+)\.svg$/);
    const name = match ? match[1].toLowerCase() : path;
    return [name, raw];
  })
);

const Icons = ({ type, width = 24, height = 24, color = "currentColor" }) => {
  const key = (type || "").toLowerCase();
  const raw = ICONS_MAP[key];

  if (!raw) {
    return <span style={{ color }}>Invalid icon type: {type}</span>;
  }

  // Replace fills except "none" so transparent areas stay transparent
  const withColor = raw.replace(/fill="(?!none")[^"]*"/g, `fill="${color}"`);

  // Ensure viewBox exists for scaling
  const svg = /viewBox=/.test(withColor)
    ? withColor
    : withColor.replace(/<svg([^>]*)>/, `<svg$1 viewBox="0 0 24 24">`);

  return (
    <span
      style={{ width, height, display: "inline-block", lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: svg }}
      aria-hidden="true"
    />
  );
};

Icons.propTypes = {
  type: PropTypes.string.isRequired,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  color: PropTypes.string,
};

export default Icons;
