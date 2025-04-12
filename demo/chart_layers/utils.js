const TILESERVER_AWS = "https://elevation-tiles-prod.s3.amazonaws.com/terrarium"
const TILESERVER_LOCAL_SEATTLE = "http://localhost:3900/services/seattle-z10-mz/tiles/"

function getLocalTileServerUrl( setname, port ){
    return `http://localhost:${port||3900}/services/${setname}/tiles/`
}

function getBrownShade(level) {
  // Clamp input level to range 0-6
  
  const maxLevel = 8;
  
  level = Math.max(0, Math.min(maxLevel, level));

  
  // Define bright and dark brown in RGB
  const brightBrown = { r: 209, g: 170, b: 132 };   // Peru-like color
  const darkBrown   = { r: 70,  g: 46,  b: 26 };   // Darker chocolate tone

  // Interpolation factor (0 = bright, 1 = dark)
  const t = level / maxLevel;

  // Linear interpolation between bright and dark brown
  const r = Math.round(brightBrown.r * (1 - t) + darkBrown.r * t);
  const g = Math.round(brightBrown.g * (1 - t) + darkBrown.g * t);
  const b = Math.round(brightBrown.b * (1 - t) + darkBrown.b * t);

  // Convert to hex and return
  return `#${((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16)
    .slice(1)
    .toUpperCase()}`;
}

