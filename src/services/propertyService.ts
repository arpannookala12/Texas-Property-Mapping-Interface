import type { Property, SearchFilters, PropertySearchResult } from '../types';

// Mock data for demonstration
const mockProperties: Property[] = [
  {
    id: '1',
    address: '123 Main St',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    county: 'Travis',
    parcelId: 'TC001234',
    owner: 'John Smith',
    assessedValue: 450000,
    marketValue: 500000,
    landValue: 200000,
    improvementValue: 300000,
    yearBuilt: 2010,
    squareFootage: 2500,
    bedrooms: 3,
    bathrooms: 2.5,
    propertyType: 'residential',
    coordinates: { lat: 30.2672, lng: -97.7431 },
  },
  {
    id: '2',
    address: '456 Oak Ave',
    city: 'Austin',
    state: 'TX',
    zipCode: '78702',
    county: 'Travis',
    parcelId: 'TC001235',
    owner: 'Jane Doe',
    assessedValue: 350000,
    marketValue: 380000,
    landValue: 150000,
    improvementValue: 230000,
    yearBuilt: 2005,
    squareFootage: 1800,
    bedrooms: 2,
    bathrooms: 2,
    propertyType: 'residential',
    coordinates: { lat: 30.2750, lng: -97.7500 },
  },
  {
    id: '3',
    address: '789 Business Blvd',
    city: 'Austin',
    state: 'TX',
    zipCode: '78703',
    county: 'Travis',
    parcelId: 'TC001236',
    owner: 'ABC Corporation',
    assessedValue: 1200000,
    marketValue: 1500000,
    landValue: 500000,
    improvementValue: 1000000,
    yearBuilt: 2015,
    squareFootage: 8000,
    bedrooms: 0,
    bathrooms: 4,
    propertyType: 'commercial',
    coordinates: { lat: 30.2600, lng: -97.7400 },
  },
  {
    id: '4',
    address: '321 Industrial Way',
    city: 'Austin',
    state: 'TX',
    zipCode: '78704',
    county: 'Travis',
    parcelId: 'TC001237',
    owner: 'XYZ Industries',
    assessedValue: 2500000,
    marketValue: 3000000,
    landValue: 800000,
    improvementValue: 2200000,
    yearBuilt: 2000,
    squareFootage: 15000,
    bedrooms: 0,
    bathrooms: 6,
    propertyType: 'industrial',
    coordinates: { lat: 30.2500, lng: -97.7300 },
  },
  {
    id: '5',
    address: '654 Farm Road',
    city: 'Austin',
    state: 'TX',
    zipCode: '78705',
    county: 'Travis',
    parcelId: 'TC001238',
    owner: 'Green Acres LLC',
    assessedValue: 800000,
    marketValue: 950000,
    landValue: 700000,
    improvementValue: 250000,
    yearBuilt: 1995,
    squareFootage: 3000,
    bedrooms: 2,
    bathrooms: 2,
    propertyType: 'agricultural',
    coordinates: { lat: 30.2800, lng: -97.7600 },
  },
];

export const searchProperties = async (
  filters: SearchFilters,
  page: number = 1,
  pageSize: number = 10
): Promise<PropertySearchResult> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  let filteredProperties = [...mockProperties];

  // Apply filters
  if (filters.propertyType) {
    filteredProperties = filteredProperties.filter(p => p.propertyType === filters.propertyType);
  }

  if (filters.minValue !== undefined) {
    filteredProperties = filteredProperties.filter(p => p.marketValue >= filters.minValue!);
  }

  if (filters.maxValue !== undefined) {
    filteredProperties = filteredProperties.filter(p => p.marketValue <= filters.maxValue!);
  }

  if (filters.minYearBuilt !== undefined) {
    filteredProperties = filteredProperties.filter(p => p.yearBuilt && p.yearBuilt >= filters.minYearBuilt!);
  }

  if (filters.maxYearBuilt !== undefined) {
    filteredProperties = filteredProperties.filter(p => p.yearBuilt && p.yearBuilt <= filters.maxYearBuilt!);
  }

  if (filters.minSquareFootage !== undefined) {
    filteredProperties = filteredProperties.filter(p => p.squareFootage && p.squareFootage >= filters.minSquareFootage!);
  }

  if (filters.maxSquareFootage !== undefined) {
    filteredProperties = filteredProperties.filter(p => p.squareFootage && p.squareFootage <= filters.maxSquareFootage!);
  }

  if (filters.bedrooms !== undefined) {
    filteredProperties = filteredProperties.filter(p => p.bedrooms && p.bedrooms >= filters.bedrooms!);
  }

  if (filters.bathrooms !== undefined) {
    filteredProperties = filteredProperties.filter(p => p.bathrooms && p.bathrooms >= filters.bathrooms!);
  }

  // Pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

  return {
    properties: paginatedProperties,
    total: filteredProperties.length,
    page,
    pageSize,
  };
};

export const getPropertyById = async (id: string): Promise<Property | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  const property = mockProperties.find(p => p.id === id);
  return property || null;
};

export const getPropertiesByBounds = async (
  bounds: { north: number; south: number; east: number; west: number }
): Promise<Property[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  return mockProperties.filter(property => 
    property.coordinates.lat >= bounds.south &&
    property.coordinates.lat <= bounds.north &&
    property.coordinates.lng >= bounds.west &&
    property.coordinates.lng <= bounds.east
  );
}; 