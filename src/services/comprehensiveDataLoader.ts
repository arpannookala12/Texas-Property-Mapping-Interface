import * as shapefile from 'shapefile';
import type { TravisCountyParcel, BuildingFootprint } from '../types';
import { loadTravisCountyBuildings } from './buildingFootprintLoader';
import { transformGeometryToWGS84, isWebMercator } from '../utils/coordinateTransform';

// Define interfaces locally since they're not exported from shapefileLoader
export interface AddressPoint {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  coordinates: { lat: number; lng: number };
  geometry: GeoJSON.Point;
}

export interface CountyBoundary {
  id: string;
  name: string;
  fips: string;
  geometry: GeoJSON.Polygon;
}

export interface TexasBoundary {
  geometry: GeoJSON.Polygon;
}

export interface ComprehensiveData {
  parcels: TravisCountyParcel[];
  addresses: AddressPoint[];
  counties: CountyBoundary[];
  texasBoundary: TexasBoundary;
  buildings: BuildingFootprint[];
}

export const loadComprehensiveData = async (): Promise<ComprehensiveData> => {
  console.log('Loading comprehensive data...');
  
  try {
    // Load all data in parallel for better performance
    const [parcels, addresses, counties, texasBoundary, buildingData] = await Promise.all([
      loadTravisCountyParcels(),
      loadTravisCountyAddresses(),
      loadCountyBoundaries(),
      loadTexasBoundary(),
      loadTravisCountyBuildings()
    ]);

    console.log('✅ All comprehensive data loaded successfully:');
    console.log(`  - ${parcels.length} parcels`);
    console.log(`  - ${addresses.length} addresses`);
    console.log(`  - ${counties.length} counties`);
    console.log(`  - ${buildingData.loadedCount} buildings`);

    return {
      parcels,
      addresses,
      counties,
      texasBoundary,
      buildings: buildingData.buildings
    };
  } catch (error) {
    console.error('Error loading comprehensive data:', error);
    throw error;
  }
};

// Load Travis County parcels
const loadTravisCountyParcels = async (): Promise<TravisCountyParcel[]> => {
  console.log('Loading Travis County parcels...');
  
  try {
    const response = await fetch('/data/stratmap24-landparcels_48453_travis_202404.shp');
    const shpBuffer = await response.arrayBuffer();
    
    const dbfResponse = await fetch('/data/stratmap24-landparcels_48453_travis_202404.dbf');
    const dbfBuffer = await dbfResponse.arrayBuffer();
    
    const source = await shapefile.open(shpBuffer, dbfBuffer);
    const parcels: TravisCountyParcel[] = [];
    
    let result;
    let index = 0;
    let skippedCount = 0;
    let transformedCount = 0;
    
    while ((result = await source.read()) && !result.done) {
      const { value } = result;
      
      // Validate geometry and properties
      if (value && value.geometry && value.properties && value.geometry.type === 'Polygon') {
        const props = value.properties;
        
        // Validate polygon coordinates
        if (!value.geometry.coordinates || 
            !Array.isArray(value.geometry.coordinates) || 
            value.geometry.coordinates.length === 0 ||
            !Array.isArray(value.geometry.coordinates[0]) ||
            value.geometry.coordinates[0].length < 3) {
          console.warn(`Skipping parcel ${index}: invalid polygon geometry`);
          skippedCount++;
          index++;
          continue;
        }
        
        // Transform coordinates if needed
        let transformedGeometry = value.geometry;
        if (isWebMercator(value.geometry.coordinates[0])) {
          console.log(`Transforming parcel ${index} from Web Mercator to WGS84`);
          transformedGeometry = transformGeometryToWGS84(value.geometry);
          transformedCount++;
        }
        
        // Build address from components
        const streetNum = props.SITUS_NUM || '';
        const streetName = props.SITUS_STRE || props.SITUS_ST_1 || '';
        const streetAddr = props.SITUS_ADDR || '';
        const fullAddress = [streetNum, streetName, streetAddr].filter(Boolean).join(' ') || 'Unknown Address';
        
        const parcel: TravisCountyParcel = {
          OBJECTID: index + 1,
          PROP_ID: props.Prop_ID || props.PROP_ID || `PARCEL-${index}`,
          SITE_ADDR: fullAddress,
          CITY: props.SITUS_CITY || props.CITY || 'Austin',
          STATE: props.SITUS_STAT || props.STATE || 'TX',
          ZIP: props.SITUS_ZIP || props.ZIP || '00000',
          OWNER_NAME: props.OWNER_NAME || props.NAME_CARE || 'Unknown Owner',
          TOTAL_VAL: parseFloat(props.MKT_VALUE || props.MARKET_VALUE || props.TOTAL_VAL || props.VALUE || '0') || 0,
          LAND_VAL: parseFloat(props.LAND_VALUE || props.LAND_VAL || '0') || 0,
          IMP_VAL: parseFloat(props.IMP_VALUE || props.IMP_VAL || '0') || 0,
          YEAR_BUILT: parseInt(props.YEAR_BUILT || props.YEAR || '0') || undefined,
          SQ_FT: parseFloat(props.GIS_AREA || props.AREA || props.SQ_FT || '0') || 0,
          BEDROOMS: parseInt(props.BEDROOMS || props.BEDS || '0') || undefined,
          BATHROOMS: parseFloat(props.BATHROOMS || props.BATHS || '0') || undefined,
          PROP_TYPE: determinePropertyType(props),
          geometry: transformedGeometry as GeoJSON.Polygon
        };
        
        parcels.push(parcel);
        index++;
        
        // Limit to first 1000 parcels for performance (can be adjusted)
        if (index >= 1000) {
          console.log('Reached 1000 parcels, stopping for performance');
          break;
        }
      } else {
        console.warn(`Skipping record ${index}: missing geometry or properties`);
        skippedCount++;
        index++;
      }
    }
    
    console.log(`Successfully loaded ${parcels.length} parcels from shapefile (skipped ${skippedCount}, transformed ${transformedCount})`);
    
    // Debug: Log a few sample parcels
    if (parcels.length > 0) {
      console.log('Sample parcel:', parcels[0]);
      console.log('Sample parcel with non-zero value:', parcels.find(p => p.TOTAL_VAL > 0) || 'No parcels with values found');
    }
    
    return parcels;
    
  } catch (error) {
    console.error('Error loading shapefile:', error);
    console.log('Falling back to mock data...');
    return getMockTravisCountyData();
  }
};

// Load Travis County addresses
const loadTravisCountyAddresses = async (): Promise<AddressPoint[]> => {
  console.log('Loading Travis County addresses...');
  
  try {
    const response = await fetch('/data/stratmap24-addresspoints_48453_travis_202402.shp');
    const shpBuffer = await response.arrayBuffer();
    
    const dbfResponse = await fetch('/data/stratmap24-addresspoints_48453_travis_202402.dbf');
    const dbfBuffer = await dbfResponse.arrayBuffer();
    
    const source = await shapefile.open(shpBuffer, dbfBuffer);
    const addresses: AddressPoint[] = [];
    
    let result;
    let index = 0;
    let skippedCount = 0;
    let transformedCount = 0;
    
    while ((result = await source.read()) && !result.done) {
      const { value } = result;
      
      // Validate geometry and properties
      if (value && value.geometry && value.properties && value.geometry.type === 'Point') {
        const props = value.properties;
        
        // Validate point coordinates
        if (!value.geometry.coordinates || 
            !Array.isArray(value.geometry.coordinates) || 
            value.geometry.coordinates.length < 2) {
          console.warn(`Skipping address ${index}: invalid point geometry`);
          skippedCount++;
          index++;
          continue;
        }
        
        // Transform coordinates if needed
        let transformedGeometry = value.geometry;
        if (isWebMercator([value.geometry.coordinates])) {
          console.log(`Transforming address ${index} from Web Mercator to WGS84`);
          transformedGeometry = transformGeometryToWGS84(value.geometry);
          transformedCount++;
        }
        
        // Build full address
        const streetNum = props.SITUS_NUM || '';
        const streetName = props.SITUS_STRE || props.SITUS_ST_1 || '';
        const streetAddr = props.SITUS_ADDR || '';
        const fullAddress = [streetNum, streetName, streetAddr].filter(Boolean).join(' ') || 'Unknown Address';
        
        const address: AddressPoint = {
          id: `addr-${index}`,
          address: fullAddress,
          city: props.SITUS_CITY || 'Austin',
          state: props.SITUS_STAT || 'TX',
          zip: props.SITUS_ZIP || '00000',
          coordinates: {
            lng: (transformedGeometry as GeoJSON.Point).coordinates[0],
            lat: (transformedGeometry as GeoJSON.Point).coordinates[1]
          },
          geometry: transformedGeometry as GeoJSON.Point
        };
        
        addresses.push(address);
        index++;
        
        // Limit for performance
        if (index >= 1000) break;
      } else {
        console.warn(`Skipping address record ${index}: missing geometry or properties`);
        skippedCount++;
        index++;
      }
    }
    
    console.log(`Loaded ${addresses.length} Travis County addresses (skipped ${skippedCount}, transformed ${transformedCount})`);
    return addresses;
    
  } catch (error) {
    console.error('Error loading addresses:', error);
    return [];
  }
};

// Load county boundaries
const loadCountyBoundaries = async (): Promise<CountyBoundary[]> => {
  console.log('Loading county boundaries...');
  
  try {
    // Try to load from JSON first
    const response = await fetch('/data/txdot_counties.json');
    if (response.ok) {
      const data = await response.json();
      console.log('Loaded county boundaries from JSON');
      
      const counties: CountyBoundary[] = data.features
        .filter((feature: any) => feature.geometry && feature.geometry.type === 'Polygon')
        .map((feature: any, index: number) => {
          // Transform coordinates if needed
          let transformedGeometry = feature.geometry;
          if (isWebMercator(feature.geometry.coordinates[0])) {
            console.log(`Transforming county ${index} from Web Mercator to WGS84`);
            transformedGeometry = transformGeometryToWGS84(feature.geometry);
          }
          
          return {
            id: `county-${index}`,
            name: feature.properties?.NAME || `County ${index}`,
            fips: feature.properties?.FIPS || '',
            geometry: transformedGeometry as GeoJSON.Polygon
          };
        });
      
      return counties;
    }
  } catch (error) {
    console.log('JSON loading failed, trying shapefile...');
  }
  
  try {
    // Fallback to shapefile
    const response = await fetch('/data/txdot_county_detailed_tx.shp');
    const shpBuffer = await response.arrayBuffer();
    
    const dbfResponse = await fetch('/data/txdot_county_detailed_tx.dbf');
    const dbfBuffer = await dbfResponse.arrayBuffer();
    
    const source = await shapefile.open(shpBuffer, dbfBuffer);
    const counties: CountyBoundary[] = [];
    
    let result;
    let index = 0;
    let skippedCount = 0;
    let transformedCount = 0;
    
    while ((result = await source.read()) && !result.done) {
      const { value } = result;
      
      // Validate geometry and properties
      if (value && value.geometry && value.properties && value.geometry.type === 'Polygon') {
        // Validate polygon coordinates
        if (!value.geometry.coordinates || 
            !Array.isArray(value.geometry.coordinates) || 
            value.geometry.coordinates.length === 0 ||
            !Array.isArray(value.geometry.coordinates[0]) ||
            value.geometry.coordinates[0].length < 3) {
          console.warn(`Skipping county ${index}: invalid polygon geometry`);
          skippedCount++;
          index++;
          continue;
        }
        
        // Transform coordinates if needed
        let transformedGeometry = value.geometry;
        if (isWebMercator(value.geometry.coordinates[0])) {
          console.log(`Transforming county ${index} from Web Mercator to WGS84`);
          transformedGeometry = transformGeometryToWGS84(value.geometry);
          transformedCount++;
        }
        
        const props = value.properties;
        const county: CountyBoundary = {
          id: `county-${index}`,
          name: props.NAME || props.COUNTY_NAME || `County ${index}`,
          fips: props.FIPS || props.COUNTY_FIPS || '',
          geometry: transformedGeometry as GeoJSON.Polygon
        };
        
        counties.push(county);
        index++;
      } else {
        console.warn(`Skipping county record ${index}: missing geometry or properties`);
        skippedCount++;
        index++;
      }
    }
    
    console.log(`Loaded ${counties.length} county boundaries from shapefile (skipped ${skippedCount}, transformed ${transformedCount})`);
    return counties;
    
  } catch (error) {
    console.error('Error loading county boundaries:', error);
    return [];
  }
};

// Load Texas boundary
const loadTexasBoundary = async (): Promise<TexasBoundary> => {
  console.log('Loading Texas boundary...');
  
  try {
    // Try to load from JSON first
    const response = await fetch('/data/texas_outline.json');
    if (response.ok) {
      const data = await response.json();
      console.log('Loaded Texas boundary from JSON');
      
      // Validate geometry
      if (data.geometry && data.geometry.type === 'Polygon' && 
          data.geometry.coordinates && Array.isArray(data.geometry.coordinates) &&
          data.geometry.coordinates.length > 0) {
        
        // Transform coordinates if needed
        let transformedGeometry = data.geometry;
        if (isWebMercator(data.geometry.coordinates[0])) {
          console.log('Transforming Texas boundary from Web Mercator to WGS84');
          transformedGeometry = transformGeometryToWGS84(data.geometry);
        }
        
        return {
          geometry: transformedGeometry as GeoJSON.Polygon
        };
      } else {
        throw new Error('Invalid geometry in Texas boundary JSON');
      }
    }
  } catch (error) {
    console.log('JSON loading failed, trying shapefile...');
  }
  
  try {
    // Fallback to shapefile
    const response = await fetch('/data/texas_outline.shp');
    const shpBuffer = await response.arrayBuffer();
    
    const dbfResponse = await fetch('/data/texas_outline.dbf');
    const dbfBuffer = await dbfResponse.arrayBuffer();
    
    const source = await shapefile.open(shpBuffer, dbfBuffer);
    const result = await source.read();
    
    if (result.value && result.value.geometry && result.value.geometry.type === 'Polygon') {
      // Validate polygon coordinates
      if (!result.value.geometry.coordinates || 
          !Array.isArray(result.value.geometry.coordinates) || 
          result.value.geometry.coordinates.length === 0 ||
          !Array.isArray(result.value.geometry.coordinates[0]) ||
          result.value.geometry.coordinates[0].length < 3) {
        throw new Error('Invalid polygon geometry in Texas boundary shapefile');
      }
      
      // Transform coordinates if needed
      let transformedGeometry = result.value.geometry;
      if (isWebMercator(result.value.geometry.coordinates[0])) {
        console.log('Transforming Texas boundary from Web Mercator to WGS84');
        transformedGeometry = transformGeometryToWGS84(result.value.geometry);
      }
      
      console.log('Loaded Texas boundary from shapefile');
      return {
        geometry: transformedGeometry as GeoJSON.Polygon
      };
    }
    
    throw new Error('No valid geometry found in Texas boundary file');
    
  } catch (error) {
    console.error('Error loading Texas boundary:', error);
    // Return a simple Texas boundary as fallback
    return {
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-106.6456, 25.8371],
          [-93.5080, 25.8371],
          [-93.5080, 36.5007],
          [-106.6456, 36.5007],
          [-106.6456, 25.8371]
        ]]
      }
    };
  }
};

// Helper function to determine property type
const determinePropertyType = (props: any): string => {
  const landUse = (props.LAND_USE || props.LANDUSE || '').toLowerCase();
  const zoning = (props.ZONING || '').toLowerCase();
  const propertyClass = (props.PROP_CLASS || props.CLASS || '').toLowerCase();
  
  if (landUse.includes('residential') || zoning.includes('residential') || propertyClass.includes('residential')) {
    return 'residential';
  } else if (landUse.includes('commercial') || zoning.includes('commercial') || propertyClass.includes('commercial')) {
    return 'commercial';
  } else if (landUse.includes('industrial') || zoning.includes('industrial') || propertyClass.includes('industrial')) {
    return 'industrial';
  } else if (landUse.includes('agricultural') || landUse.includes('farm') || propertyClass.includes('agricultural')) {
    return 'agricultural';
  } else if (landUse.includes('vacant') || landUse.includes('undeveloped')) {
    return 'vacant';
  }
  
  return 'residential'; // Default
};

// Mock data fallback
const getMockTravisCountyData = (): TravisCountyParcel[] => {
  return [
    {
      OBJECTID: 1,
      PROP_ID: 'MOCK-001',
      SITE_ADDR: '123 Main St',
      CITY: 'Austin',
      STATE: 'TX',
      ZIP: '78701',
      OWNER_NAME: 'Mock Owner',
      TOTAL_VAL: 250000,
      LAND_VAL: 100000,
      IMP_VAL: 150000,
      YEAR_BUILT: 1990,
      SQ_FT: 2000,
      BEDROOMS: 3,
      BATHROOMS: 2,
      PROP_TYPE: 'residential',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-97.7431, 30.2672],
          [-97.7421, 30.2672],
          [-97.7421, 30.2682],
          [-97.7431, 30.2682],
          [-97.7431, 30.2672]
        ]]
      }
    }
  ];
}; 