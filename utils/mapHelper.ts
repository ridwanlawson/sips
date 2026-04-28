/**
 * Build Google Maps URL from location string
 * Supports both lat,lng coordinates and address strings
 */
export const buildMapUrl = (loc: string): string => {
  const s = (loc || "").trim();
  const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (m) {
    const lat = m[1];
    const lng = m[3];
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s)}`;
};
