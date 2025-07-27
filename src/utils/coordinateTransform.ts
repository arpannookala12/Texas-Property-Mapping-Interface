// Coordinate transformation utilities
// Web Mercator (EPSG:3857) to WGS84 (EPSG:4326)

const EARTH_RADIUS = 6378137; // Earth's radius in meters
const MAX_LATITUDE = 85.05112877980659; // Maximum latitude in Web Mercator

/**
 * Convert Web Mercator X coordinate to longitude
 */
export const mercatorXToLng = (x: number): number => {
  return (x / EARTH_RADIUS) * (180 / Math.PI);
};

/**
 * Convert Web Mercator Y coordinate to latitude
 */
export const mercatorYToLat = (y: number): number => {
  const lat = Math.atan(Math.exp(y / EARTH_RADIUS)) * 2 - Math.PI / 2;
  return lat * (180 / Math.PI);
};

/**
 * Convert longitude to Web Mercator X coordinate
 */
export const lngToMercatorX = (lng: number): number => {
  return (lng * Math.PI / 180) * EARTH_RADIUS;
};

/**
 * Convert latitude to Web Mercator Y coordinate
 */
export const latToMercatorY = (lat: number): number => {
  const latRad = lat * Math.PI / 180;
  return Math.log(Math.tan((Math.PI / 4) + (latRad / 2))) * EARTH_RADIUS;
};

/**
 * Transform a coordinate pair from Web Mercator to WGS84
 */
export const transformMercatorToWGS84 = (coord: [number, number]): [number, number] => {
  const [x, y] = coord;
  return [mercatorXToLng(x), mercatorYToLat(y)];
};

/**
 * Transform a coordinate pair from WGS84 to Web Mercator
 */
export const transformWGS84ToMercator = (coord: [number, number]): [number, number] => {
  const [lng, lat] = coord;
  return [lngToMercatorX(lng), latToMercatorY(lat)];
};

/**
 * Transform polygon coordinates from Web Mercator to WGS84
 */
export const transformPolygonToWGS84 = (coordinates: number[][][]): number[][][] => {
  return coordinates.map(ring => 
    ring.map(coord => transformMercatorToWGS84(coord as [number, number]))
  );
};

/**
 * Transform point coordinates from Web Mercator to WGS84
 */
export const transformPointToWGS84 = (coordinates: number[]): number[] => {
  return transformMercatorToWGS84(coordinates as [number, number]);
};

/**
 * Detect if coordinates are in Web Mercator projection
 */
export const isWebMercator = (coordinates: number[][]): boolean => {
  if (coordinates.length === 0) return false;
  
  const sampleCoord = coordinates[0];
  if (sampleCoord.length < 2) return false;
  
  const [x, y] = sampleCoord;
  
  // Web Mercator coordinates are typically very large numbers
  // WGS84 coordinates are typically small numbers
  return Math.abs(x) > 10000 || Math.abs(y) > 10000;
};

/**
 * Transform any geometry from Web Mercator to WGS84 if needed
 */
export const transformGeometryToWGS84 = (geometry: any): any => {
  if (!geometry || !geometry.coordinates) return geometry;
  
  switch (geometry.type) {
    case 'Polygon':
      if (isWebMercator(geometry.coordinates[0])) {
        return {
          ...geometry,
          coordinates: transformPolygonToWGS84(geometry.coordinates)
        };
      }
      break;
      
    case 'Point':
      if (isWebMercator([geometry.coordinates])) {
        return {
          ...geometry,
          coordinates: transformPointToWGS84(geometry.coordinates)
        };
      }
      break;
      
    case 'MultiPolygon':
      if (geometry.coordinates.length > 0 && isWebMercator(geometry.coordinates[0][0])) {
        return {
          ...geometry,
          coordinates: geometry.coordinates.map((polygon: number[][][]) => 
            transformPolygonToWGS84(polygon)
          )
        };
      }
      break;
  }
  
  return geometry;
}; 