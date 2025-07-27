export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  parcelId?: string;
  owner: string;
  assessedValue?: number;
  marketValue: number;
  landValue?: number;
  improvementValue?: number;
  yearBuilt?: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType: 'residential' | 'commercial' | 'industrial' | 'agricultural' | 'vacant' | 'mixed-use';
  coordinates: {
    lat: number;
    lng: number;
  };
  geometry?: GeoJSON.Polygon;
  // New fields for enhanced property submission
  acreage?: number;
  description?: string;
  submittedAt?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

export interface SearchFilters {
  address?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  state?: string;
}

export interface PropertySearchResult {
  properties: Property[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  source: string;
  type: 'fill' | 'line' | 'symbol' | 'circle' | 'heatmap';
}

export interface TravisCountyParcel {
  OBJECTID: number;
  PROP_ID: string;
  SITE_ADDR: string;
  CITY: string;
  STATE: string;
  ZIP: string;
  OWNER_NAME: string;
  TOTAL_VAL: number;
  LAND_VAL: number;
  IMP_VAL: number;
  YEAR_BUILT?: number;
  SQ_FT: number;
  BEDROOMS?: number;
  BATHROOMS?: number;
  PROP_TYPE: string;
  geometry: GeoJSON.Polygon;
} 