import type { BuildingFootprint } from '../types';

// Travis County bounding box (approximate)
const TRAVIS_COUNTY_BOUNDS = {
  north: 30.8,
  south: 30.0,
  east: -97.4,
  west: -98.2
};

// Sample size for performance
const MAX_BUILDINGS = 500;

export interface BuildingFootprintData {
  buildings: BuildingFootprint[];
  totalCount: number;
  loadedCount: number;
}

export const loadTravisCountyBuildings = async (): Promise<BuildingFootprintData> => {
  try {
    console.log('Loading Travis County building footprints...');
    
    // First, try to load the extracted Travis County buildings file
    const travisResponse = await fetch('/data/travis-buildings.json');
    if (travisResponse.ok) {
      console.log('Found extracted Travis County buildings file, loading...');
      const travisData = await travisResponse.json();
      
      // Convert GeoJSON features to BuildingFootprint format
      const buildings: BuildingFootprint[] = travisData.features.map((feature: any, index: number) => ({
        id: feature.properties?.osm_id || `building_${index}`,
        geometry: feature.geometry,
        height: feature.properties?.height || -1,
        confidence: feature.properties?.confidence || -1,
        area: calculateArea(feature.geometry),
        coordinates: getCenterCoordinates(feature.geometry),
        properties: {
          building: feature.properties?.building || 'yes',
          amenity: feature.properties?.amenity || null,
          shop: feature.properties?.shop || null,
          office: feature.properties?.office || null,
          residential: feature.properties?.residential || null
        }
      }));
      
      console.log(`✅ Loaded ${buildings.length} real Travis County buildings`);
      
      return {
        buildings,
        totalCount: buildings.length,
        loadedCount: buildings.length
      };
    }

    // Fallback to mock buildings if no extracted file
    console.log('No extracted file found, creating mock buildings for Travis County...');
    const mockBuildings = createMockTravisCountyBuildings();
    
    return {
      buildings: mockBuildings,
      totalCount: mockBuildings.length,
      loadedCount: mockBuildings.length
    };
    
  } catch (error) {
    console.error('Error loading building footprints:', error);
    console.log('Falling back to mock buildings...');
    
    const mockBuildings = createMockTravisCountyBuildings();
    return {
      buildings: mockBuildings,
      totalCount: mockBuildings.length,
      loadedCount: mockBuildings.length
    };
  }
};

const createMockTravisCountyBuildings = (): BuildingFootprint[] => {
  const buildings: BuildingFootprint[] = [];
  
  // Create mock buildings in Austin/Travis County area
  const austinCenter = { lat: 30.2672, lng: -97.7431 };
  
  for (let i = 0; i < MAX_BUILDINGS; i++) {
    // Random position within Travis County
    const lat = austinCenter.lat + (Math.random() - 0.5) * 0.3; // ±0.15 degrees
    const lng = austinCenter.lng + (Math.random() - 0.5) * 0.3; // ±0.15 degrees
    
    // Ensure within Travis County bounds
    if (lat >= TRAVIS_COUNTY_BOUNDS.south && lat <= TRAVIS_COUNTY_BOUNDS.north &&
        lng >= TRAVIS_COUNTY_BOUNDS.west && lng <= TRAVIS_COUNTY_BOUNDS.east) {
      
      // Create a simple rectangular building
      const buildingSize = 0.001; // Small building footprint
      const building: BuildingFootprint = {
        id: `mock_building_${i}`,
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [lng - buildingSize, lat - buildingSize],
            [lng + buildingSize, lat - buildingSize],
            [lng + buildingSize, lat + buildingSize],
            [lng - buildingSize, lat + buildingSize],
            [lng - buildingSize, lat - buildingSize]
          ]]
        },
        height: Math.random() * 50 + 5, // 5-55 meters
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
        area: Math.random() * 1000 + 100, // 100-1100 sq units
        coordinates: { lat, lng },
        properties: {
          building: 'yes',
          amenity: Math.random() > 0.8 ? 'school' : null,
          shop: Math.random() > 0.9 ? 'convenience' : null,
          office: Math.random() > 0.85 ? 'yes' : null,
          residential: Math.random() > 0.6 ? 'yes' : null
        }
      };
      
      buildings.push(building);
    }
  }
  
  console.log(`Created ${buildings.length} mock buildings in Travis County`);
  return buildings;
};

// Alternative approach: Create a smaller sample from the large file
export const createTravisCountySample = async (): Promise<void> => {
  try {
    console.log('Creating Travis County building sample...');
    
    const response = await fetch('/data/Texas.geojson');
    if (!response.ok) {
      throw new Error('Failed to load Texas.geojson');
    }
    
    // Read the first 10MB to find some Travis County buildings
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }
    
    let buffer = '';
    let totalRead = 0;
    const maxRead = 10 * 1024 * 1024; // 10MB
    
    const buildings: BuildingFootprint[] = [];
    let foundCount = 0;
    
    while (totalRead < maxRead && foundCount < 100) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += new TextDecoder().decode(value);
      totalRead += value.length;
      
      // Process complete features
      while (buffer.includes('"type": "Feature"') && foundCount < 100) {
        const featureStart = buffer.indexOf('"type": "Feature"');
        const featureEnd = buffer.indexOf('},', featureStart);
        
        if (featureEnd === -1) break;
        
        const featureStr = buffer.substring(featureStart - 1, featureEnd + 1);
        buffer = buffer.substring(featureEnd + 2);
        
        try {
          const feature = JSON.parse(`{${featureStr}}`);
          
          if (isInTravisCounty(feature)) {
            const building = parseBuildingFeature(feature);
            if (building) {
              buildings.push(building);
              foundCount++;
            }
          }
        } catch (error) {
          // Skip malformed features
        }
      }
    }
    
    console.log(`Found ${buildings.length} Travis County buildings in sample`);
    
    // Save the sample for future use
    const sampleData = {
      buildings,
      totalCount: buildings.length,
      loadedCount: buildings.length,
      created: new Date().toISOString()
    };
    
    console.log('Sample data:', sampleData);
    
  } catch (error) {
    console.error('Error creating sample:', error);
  }
};

const isInTravisCounty = (feature: any): boolean => {
  try {
    if (!feature.geometry || !feature.geometry.coordinates) {
      return false;
    }

    // Get the center point of the building
    let centerLng = 0, centerLat = 0;
    let pointCount = 0;

    if (feature.geometry.type === 'Polygon') {
      const coordinates = feature.geometry.coordinates[0]; // First ring
      coordinates.forEach((coord: number[]) => {
        centerLng += coord[0];
        centerLat += coord[1];
        pointCount++;
      });
    } else if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach((polygon: number[][][]) => {
        polygon[0].forEach((coord: number[]) => {
          centerLng += coord[0];
          centerLat += coord[1];
          pointCount++;
        });
      });
    }

    if (pointCount === 0) return false;

    centerLng /= pointCount;
    centerLat /= pointCount;

    // Check if center is in Travis County bounds
    return (
      centerLat >= TRAVIS_COUNTY_BOUNDS.south &&
      centerLat <= TRAVIS_COUNTY_BOUNDS.north &&
      centerLng >= TRAVIS_COUNTY_BOUNDS.west &&
      centerLng <= TRAVIS_COUNTY_BOUNDS.east
    );
  } catch (error) {
    console.warn('Error checking Travis County bounds:', error);
    return false;
  }
};

const parseBuildingFeature = (feature: any): BuildingFootprint | null => {
  try {
    if (!feature.geometry || !feature.properties) {
      return null;
    }

    // Extract properties
    const properties = feature.properties;
    
    return {
      id: properties.osm_id || `building_${Date.now()}_${Math.random()}`,
      geometry: feature.geometry,
      height: properties.height || -1,
      confidence: properties.confidence || -1,
      area: calculateArea(feature.geometry),
      coordinates: getCenterCoordinates(feature.geometry),
      properties: {
        building: properties.building || 'yes',
        amenity: properties.amenity || null,
        shop: properties.shop || null,
        office: properties.office || null,
        residential: properties.residential || null
      }
    };
  } catch (error) {
    console.warn('Error parsing building feature:', error);
    return null;
  }
};

const calculateArea = (geometry: any): number => {
  try {
    // Simple area calculation (approximate)
    if (geometry.type === 'Polygon') {
      const coordinates = geometry.coordinates[0];
      let area = 0;
      
      for (let i = 0; i < coordinates.length - 1; i++) {
        const [x1, y1] = coordinates[i];
        const [x2, y2] = coordinates[i + 1];
        area += (x2 - x1) * (y1 + y2) / 2;
      }
      
      return Math.abs(area);
    }
    
    return 0;
  } catch (error) {
    return 0;
  }
};

const getCenterCoordinates = (geometry: any): { lat: number; lng: number } => {
  try {
    let centerLng = 0, centerLat = 0;
    let pointCount = 0;

    if (geometry.type === 'Polygon') {
      const coordinates = geometry.coordinates[0];
      coordinates.forEach((coord: number[]) => {
        centerLng += coord[0];
        centerLat += coord[1];
        pointCount++;
      });
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((polygon: number[][][]) => {
        polygon[0].forEach((coord: number[]) => {
          centerLng += coord[0];
          centerLat += coord[1];
          pointCount++;
        });
      });
    }

    if (pointCount === 0) {
      return { lat: 30.2672, lng: -97.7431 }; // Default to Austin
    }

    return {
      lng: centerLng / pointCount,
      lat: centerLat / pointCount
    };
  } catch (error) {
    return { lat: 30.2672, lng: -97.7431 }; // Default to Austin
  }
}; 