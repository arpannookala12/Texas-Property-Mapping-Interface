# Texas Property Mapping Interface

An interactive GIS application for exploring Travis County real estate data with advanced mapping capabilities, property submission, and filtering features.

## 🏗️ Tech Stack & Architecture

### **Frontend Technologies**
- **React 18** - Modern component-based UI framework
- **TypeScript** - Type-safe development with enhanced IDE support
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **Lucide React** - Modern icon library

### **Mapping & GIS**
- **Mapbox GL JS** - High-performance vector mapping library
- **Shapefile.js** - Client-side shapefile parsing
- **GeoJSON** - Standard geospatial data format
- **Coordinate Transformation** - Web Mercator to WGS84 conversion utilities

### **Data Management**
- **Local Storage** - Client-side property data persistence
- **Fetch API** - HTTP requests for external data
- **Mapbox Geocoding API** - Address to coordinate conversion

### **Testing Framework**
- **Vitest** - Fast unit testing framework
- **@testing-library/react** - React component testing utilities
- **@testing-library/jest-dom** - Custom matchers for DOM testing

### **Development Tools**
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing pipeline
- **Autoprefixer** - CSS vendor prefixing

## 🗺️ Layer Toggle System

### **Architecture Overview**
The layer toggle system provides dynamic map visualization with real-time layer switching. Each layer type serves a specific purpose and can be toggled independently.

### **Layer Types**
```typescript
type MapLayerType = 'all' | 'parcels' | 'points' | 'clusters' | 'heatmap' | 'buildings';
```

1. **All Layers** - Comprehensive view showing all available data
2. **Parcels** - Travis County land parcel boundaries
3. **Points** - GeoJSON point data with interactive popups
4. **Clusters** - Clustered markers for dense data visualization
5. **Heatmap** - Density-based visualization of property data
6. **Buildings** - Microsoft Building Footprints integration

### **Implementation Details**

#### **Layer Management**
```typescript
const addAllLayers = () => {
  // Remove existing layers and sources
  const layersToRemove = [
    'properties', 'parcel-boundaries', 'submitted-properties',
    'clusters', 'heatmap', 'addresses', 'county-boundaries',
    'texas-boundary', 'geojson-points', 'buildings-fill'
  ];
  
  // Add layers based on layerType
  switch (layerType) {
    case 'all':
      addTexasBoundary();
      addCountyBoundaries();
      addTravisCountyParcels();
      addAddresses();
      addBuildingFootprints();
      addPropertyLayers();
      break;
    // ... other cases
  }
};
```

#### **Source Existence Checks**
To prevent duplicate source errors during layer switching:
```typescript
const addTravisCountyParcels = () => {
  if (map.current.getSource('travis-parcels')) {
    console.log('Source already exists, skipping');
    return;
  }
  // Add source and layers
};
```

#### **Performance Optimizations**
- **Lazy Loading** - Layers added only when needed
- **Source Caching** - Prevent duplicate source creation
- **Layer Cleanup** - Proper removal of unused layers
- **Repaint Triggering** - Force map updates for immediate visibility

### **Data Sources**
- **Travis County Parcels** - Land parcel boundaries with property data
- **Address Points** - Geocoded address data
- **County Boundaries** - Administrative boundary data
- **Texas Boundary** - State-level boundary data
- **Building Footprints** - Microsoft building data (optional)
- **User-Submitted Properties** - Custom property submissions

## 🚀 Production Scaling Strategy

### **Current Architecture Limitations**

#### **Frontend Constraints**
- **Client-Side Data Processing** - Large datasets processed in browser
- **Local Storage Limits** - ~5-10MB storage capacity
- **Memory Usage** - Large GeoJSON files loaded into memory
- **Network Dependencies** - Mapbox API rate limits

#### **Performance Bottlenecks**
- **Shapefile Processing** - CPU-intensive parsing
- **Coordinate Transformations** - Real-time calculations
- **Layer Switching** - Complex state management
- **Data Synchronization** - Client-server data consistency

### **Production Scaling Roadmap**

#### **Phase 1: Backend Infrastructure**
```python
# FastAPI Backend Architecture
from fastapi import FastAPI
from sqlalchemy.orm import Session
from typing import List

app = FastAPI()

class PropertyService:
    def search_properties(self, filters: dict) -> List[Property]:
        """Server-side property search with pagination"""
        pass
    
    def get_property_details(self, property_id: str) -> Property:
        """Detailed property information"""
        pass

class DataProcessingService:
    def process_shapefiles(self, file_path: str) -> dict:
        """Server-side shapefile processing"""
        pass
    
    def transform_coordinates(self, coordinates: List) -> List:
        """Optimized coordinate transformation"""
        pass
```

#### **Phase 2: Database Design**
```sql
-- PostgreSQL with PostGIS extension
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    parcel_id VARCHAR UNIQUE,
    address TEXT,
    coordinates GEOMETRY(POINT, 4326),
    market_value DECIMAL,
    property_type VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_properties_coordinates ON properties USING GIST(coordinates);
CREATE INDEX idx_properties_market_value ON properties(market_value);
```

#### **Phase 3: API Architecture**
```typescript
// RESTful API endpoints
interface PropertyAPI {
  // Property search with filters
  GET /api/properties?filters={...}
  
  // Property details
  GET /api/properties/{id}
  
  // User submissions
  POST /api/properties
  PUT /api/properties/{id}
  DELETE /api/properties/{id}
  
  // Layer data
  GET /api/layers/{layerType}
  
  // Spatial queries
  GET /api/spatial/within?bounds={...}
}
```

#### **Phase 4: Performance Optimizations**

**Caching Strategy**
```typescript
// Redis caching for frequently accessed data
const cacheLayer = async (layerType: string, data: any) => {
  await redis.setex(`layer:${layerType}`, 3600, JSON.stringify(data));
};

const getCachedLayer = async (layerType: string) => {
  const cached = await redis.get(`layer:${layerType}`);
  return cached ? JSON.parse(cached) : null;
};
```

**CDN Integration**
```typescript
// Static asset optimization
const staticAssets = {
  mapTiles: 'https://cdn.mapbox.com/mapbox-gl-js/v2.15.0/',
  dataFiles: 'https://cdn.example.com/data/',
  images: 'https://cdn.example.com/images/'
};
```

**Database Optimization**
```sql
-- Partitioning for large datasets
CREATE TABLE properties_2024 PARTITION OF properties
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Materialized views for complex queries
CREATE MATERIALIZED VIEW property_summary AS
SELECT 
  property_type,
  COUNT(*) as count,
  AVG(market_value) as avg_value
FROM properties
GROUP BY property_type;
```

### **Scalability Considerations**

#### **Horizontal Scaling**
- **Load Balancers** - Distribute traffic across multiple servers
- **Database Sharding** - Partition data by geographic regions
- **Microservices** - Separate concerns (mapping, data, users)
- **Container Orchestration** - Kubernetes for deployment management

#### **Performance Monitoring**
```typescript
// Application performance monitoring
const performanceMetrics = {
  layerLoadTime: measureLayerLoad(),
  queryResponseTime: measureQueryTime(),
  memoryUsage: measureMemoryUsage(),
  userInteractions: trackUserActions()
};
```

#### **Data Pipeline**
```python
# ETL pipeline for data processing
class DataPipeline:
    def extract_shapefiles(self, source_path: str) -> dict:
        """Extract data from shapefiles"""
        pass
    
    def transform_coordinates(self, data: dict) -> dict:
        """Transform coordinates to WGS84"""
        pass
    
    def load_to_database(self, data: dict) -> bool:
        """Load processed data to database"""
        pass
```

### **Security Considerations**

#### **API Security**
```typescript
// JWT authentication
const authenticateUser = async (token: string) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded.user;
};

// Rate limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

#### **Data Protection**
- **Input Validation** - Sanitize all user inputs
- **SQL Injection Prevention** - Use parameterized queries
- **CORS Configuration** - Restrict cross-origin requests
- **HTTPS Enforcement** - Secure all communications

### **Deployment Strategy**

#### **Infrastructure as Code**
```yaml
# Docker Compose for local development
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000
  
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/properties
  
  database:
    image: postgis/postgis:13-3.1
    environment:
      - POSTGRES_DB=properties
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
```

#### **CI/CD Pipeline**
```yaml
# GitHub Actions workflow
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: ./deploy.sh
```

## 📊 Performance Metrics

### **Current Performance**
- **Initial Load Time**: ~3-5 seconds
- **Layer Switch Time**: ~1-2 seconds
- **Memory Usage**: ~50-100MB for large datasets
- **Network Requests**: 5-10 requests per session

### **Target Performance**
- **Initial Load Time**: <2 seconds
- **Layer Switch Time**: <500ms
- **Memory Usage**: <50MB
- **Network Requests**: <5 requests per session

## 🔮 Future Enhancements

### **Short Term (1-3 months)**
- [ ] Backend API implementation
- [ ] Database migration
- [ ] Performance optimization
- [ ] User authentication

### **Medium Term (3-6 months)**
- [ ] Advanced filtering
- [ ] Real-time updates
- [ ] Mobile optimization
- [ ] Analytics dashboard

### **Long Term (6+ months)**
- [ ] AI-powered recommendations
- [ ] Predictive analytics
- [ ] Multi-region support
- [ ] Advanced GIS features

## 🛠️ Development Setup

```bash
# Clone repository
git clone https://github.com/your-org/texas-property-mapping.git
cd texas-property-mapping

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
