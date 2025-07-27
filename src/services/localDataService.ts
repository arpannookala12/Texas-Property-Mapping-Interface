import type { Property, TravisCountyParcel } from '../types';
import { loadTravisCountyShapefile } from './shapefileLoader';

export const loadTravisCountyData = async (): Promise<TravisCountyParcel[]> => {
  console.log('Loading Travis County data...');
  
  // Use the shapefile loader to get real data
  return await loadTravisCountyShapefile();
};

export const convertToProperty = (parcel: TravisCountyParcel): Property => {
  // Calculate center point of the polygon for coordinates
  const coordinates = calculatePolygonCenter(parcel.geometry);
  
  return {
    id: parcel.PROP_ID || `parcel-${parcel.OBJECTID}`,
    address: parcel.SITE_ADDR,
    city: parcel.CITY,
    state: parcel.STATE,
    zipCode: parcel.ZIP,
    county: 'Travis',
    parcelId: parcel.PROP_ID,
    owner: parcel.OWNER_NAME,
    assessedValue: parcel.TOTAL_VAL,
    marketValue: parcel.TOTAL_VAL,
    landValue: parcel.LAND_VAL,
    improvementValue: parcel.IMP_VAL,
    yearBuilt: parcel.YEAR_BUILT,
    squareFootage: parcel.SQ_FT,
    bedrooms: parcel.BEDROOMS,
    bathrooms: parcel.BATHROOMS,
    propertyType: mapPropertyType(parcel.PROP_TYPE),
    coordinates,
    geometry: parcel.geometry,
  };
};

const calculatePolygonCenter = (geometry: GeoJSON.Polygon): { lat: number; lng: number } => {
  if (!geometry.coordinates || geometry.coordinates.length === 0) {
    return { lat: 30.2672, lng: -97.7431 }; // Default to Austin
  }
  
  const coordinates = geometry.coordinates[0]; // First ring of the polygon
  let sumLng = 0;
  let sumLat = 0;
  
  for (const coord of coordinates) {
    sumLng += coord[0];
    sumLat += coord[1];
  }
  
  return {
    lng: sumLng / coordinates.length,
    lat: sumLat / coordinates.length,
  };
};

const mapPropertyType = (type: string): Property['propertyType'] => {
  const lowerType = type.toLowerCase();
  
  if (lowerType.includes('residential') || lowerType.includes('single') || lowerType.includes('multi')) {
    return 'residential';
  } else if (lowerType.includes('commercial') || lowerType.includes('retail') || lowerType.includes('office')) {
    return 'commercial';
  } else if (lowerType.includes('industrial') || lowerType.includes('manufacturing')) {
    return 'industrial';
  } else if (lowerType.includes('agricultural') || lowerType.includes('farm') || lowerType.includes('rural')) {
    return 'agricultural';
  } else {
    return 'vacant';
  }
}; 