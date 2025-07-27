import * as shapefile from 'shapefile';
import type { Property, TravisCountyParcel } from '../types';

export interface ShapefileFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    [key: string]: any;
  };
}

export const processTravisCountyShapefile = async (file: File): Promise<TravisCountyParcel[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const source = await shapefile.open(arrayBuffer);
    
    const parcels: TravisCountyParcel[] = [];
    let result;
    
    while ((result = await source.read()) && !result.done) {
      const feature = result.value as ShapefileFeature;
      
      // Extract properties from the shapefile
      const properties = feature.properties;
      
      const parcel: TravisCountyParcel = {
        OBJECTID: properties.OBJECTID || Math.random(),
        PROP_ID: properties.PROP_ID || properties.PROPID || properties.PARCEL_ID || '',
        SITE_ADDR: properties.SITE_ADDR || properties.ADDRESS || properties.SITE_ADDRESS || '',
        CITY: properties.CITY || 'Austin',
        STATE: properties.STATE || 'TX',
        ZIP: properties.ZIP || properties.ZIP_CODE || '',
        OWNER_NAME: properties.OWNER_NAME || properties.OWNER || '',
        TOTAL_VAL: properties.TOTAL_VAL || properties.MARKET_VAL || properties.VALUE || 0,
        LAND_VAL: properties.LAND_VAL || properties.LAND_VALUE || 0,
        IMP_VAL: properties.IMP_VAL || properties.IMPROVEMENT_VAL || 0,
        YEAR_BUILT: properties.YEAR_BUILT || properties.YEAR || undefined,
        SQ_FT: properties.SQ_FT || properties.SQUARE_FEET || properties.AREA || undefined,
        BEDROOMS: properties.BEDROOMS || properties.BEDS || undefined,
        BATHROOMS: properties.BATHROOMS || properties.BATHS || undefined,
        PROP_TYPE: properties.PROP_TYPE || properties.TYPE || 'residential',
        geometry: feature.geometry as GeoJSON.Polygon,
      };
      
      parcels.push(parcel);
    }
    
    return parcels;
  } catch (error) {
    console.error('Error processing shapefile:', error);
    throw error;
  }
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