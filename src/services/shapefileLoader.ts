import * as shapefile from 'shapefile';
import type { TravisCountyParcel } from '../types';

export const loadTravisCountyShapefile = async (): Promise<TravisCountyParcel[]> => {
  console.log('Loading Travis County shapefile...');
  
  try {
    // Load the shapefile from the public directory
    const response = await fetch('/data/stratmap24-landparcels_48453_travis_202404.shp');
    const shpBuffer = await response.arrayBuffer();
    
    // Load the DBF file for attributes
    const dbfResponse = await fetch('/data/stratmap24-landparcels_48453_travis_202404.dbf');
    const dbfBuffer = await dbfResponse.arrayBuffer();
    
    console.log('Shapefile and DBF loaded, parsing...');
    
    // Parse the shapefile
    const source = await shapefile.open(shpBuffer, dbfBuffer);
    const parcels: TravisCountyParcel[] = [];
    
    let result;
    let index = 0;
    
    while ((result = await source.read()) && !result.done) {
      const { value } = result;
      
      if (value && value.geometry && value.properties) {
        // Debug: Log the first few properties to see what fields are available
        if (index === 0) {
          console.log('First parcel properties:', value.properties);
          console.log('Available fields:', Object.keys(value.properties));
        }
        
        // Extract properties from the DBF file
        const props = value.properties;
        
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
          geometry: value.geometry as GeoJSON.Polygon
        };
        
        parcels.push(parcel);
        index++;
        
        // Limit to first 1000 parcels for performance (can be adjusted)
        if (index >= 1000) {
          console.log('Reached 1000 parcels, stopping for performance');
          break;
        }
      }
    }
    
    console.log(`Successfully loaded ${parcels.length} parcels from shapefile`);
    
    // Debug: Log a few sample parcels
    if (parcels.length > 0) {
      console.log('Sample parcel:', parcels[0]);
      console.log('Sample parcel with non-zero value:', parcels.find(p => p.TOTAL_VAL > 0) || 'No parcels with values found');
    }
    
    return parcels;
    
  } catch (error) {
    console.error('Error loading shapefile:', error);
    
    // Fallback to mock data if shapefile loading fails
    console.log('Falling back to mock data...');
    return getMockTravisCountyData();
  }
};

// Helper function to determine property type based on available data
const determinePropertyType = (props: any): string => {
  // Check if there are any clues in the data about property type
  const landValue = parseFloat(props.LAND_VALUE || '0');
  const impValue = parseFloat(props.IMP_VALUE || '0');
  const totalValue = parseFloat(props.MKT_VALUE || '0');
  
  // If improvement value is very low compared to land value, likely vacant
  if (impValue < landValue * 0.1 && totalValue < 50000) {
    return 'vacant';
  }
  
  // If high improvement value, likely residential or commercial
  if (impValue > landValue * 2) {
    return 'residential';
  }
  
  // If very high total value, likely commercial
  if (totalValue > 1000000) {
    return 'commercial';
  }
  
  // Default to residential
  return 'residential';
};

// Fallback mock data
const getMockTravisCountyData = (): TravisCountyParcel[] => [
  {
    OBJECTID: 1,
    PROP_ID: 'TC001234',
    SITE_ADDR: '123 Main St',
    CITY: 'Austin',
    STATE: 'TX',
    ZIP: '78701',
    OWNER_NAME: 'John Smith',
    TOTAL_VAL: 450000,
    LAND_VAL: 200000,
    IMP_VAL: 250000,
    YEAR_BUILT: 2010,
    SQ_FT: 2500,
    BEDROOMS: 3,
    BATHROOMS: 2.5,
    PROP_TYPE: 'residential',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-97.7431, 30.2672],
        [-97.7432, 30.2672],
        [-97.7432, 30.2673],
        [-97.7431, 30.2673],
        [-97.7431, 30.2672]
      ]]
    }
  },
  {
    OBJECTID: 2,
    PROP_ID: 'TC001235',
    SITE_ADDR: '456 Oak Ave',
    CITY: 'Austin',
    STATE: 'TX',
    ZIP: '78702',
    OWNER_NAME: 'Jane Doe',
    TOTAL_VAL: 380000,
    LAND_VAL: 150000,
    IMP_VAL: 230000,
    YEAR_BUILT: 2005,
    SQ_FT: 1800,
    BEDROOMS: 2,
    BATHROOMS: 2,
    PROP_TYPE: 'residential',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-97.7500, 30.2750],
        [-97.7501, 30.2750],
        [-97.7501, 30.2751],
        [-97.7500, 30.2751],
        [-97.7500, 30.2750]
      ]]
    }
  },
  {
    OBJECTID: 3,
    PROP_ID: 'TC001236',
    SITE_ADDR: '789 Business Blvd',
    CITY: 'Austin',
    STATE: 'TX',
    ZIP: '78703',
    OWNER_NAME: 'ABC Corporation',
    TOTAL_VAL: 1500000,
    LAND_VAL: 500000,
    IMP_VAL: 1000000,
    YEAR_BUILT: 2015,
    SQ_FT: 8000,
    BEDROOMS: 0,
    BATHROOMS: 4,
    PROP_TYPE: 'commercial',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-97.7400, 30.2600],
        [-97.7401, 30.2600],
        [-97.7401, 30.2601],
        [-97.7400, 30.2601],
        [-97.7400, 30.2600]
      ]]
    }
  }
]; 