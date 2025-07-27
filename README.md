# Texas Property Mapping Interface

A functional prototype of a map-based real estate submission system using React, TypeScript, and Mapbox GL JS for Travis County, Texas.

## 🎯 Core Features

### 1. Base Map with Parcel Boundaries
- Interactive Mapbox map with Travis County parcel boundaries
- Hoverable and clickable parcel polygons with popup information
- Clean, responsive design with proper sizing

### 2. Property Submission System
- **Form Fields**: Address, price, acreage, property type, description
- **Geocoding**: Automatic coordinate conversion using Mapbox Geocoding API
- **Visual Feedback**: Submitted properties appear as markers on the map
- **Local Storage**: Properties stored in JSON format using localStorage

### 3. Property Management
- **View Properties**: Click on submitted properties to view details
- **Delete Properties**: Remove properties with confirmation
- **Property Cards**: Detailed information cards with all property data

### 4. Layer Toggle System
- **GeoJSON Points**: All properties displayed as interactive points with popups
- **Clustered Markers**: Properties grouped into clusters for better visualization
- **Heatmap Layer**: Property density visualization based on market values

### 5. Search & Filtering
- **Address Search**: Filter properties by address
- **Property Type Filter**: Filter by residential, commercial, etc.
- **Price Range**: Filter by minimum and maximum price
- **Real-time Updates**: Filters apply immediately to the map

### 6. TCAD Data Integration
- **Enriched Properties**: Address points enriched with Travis County Appraisal District data
- **Real Market Values**: Actual property valuations and details
- **Interactive Markers**: Clickable enriched properties with detailed information

### 7. Test Framework
- **Comprehensive Testing**: Test page to validate all system components
- **Individual Tests**: Test each feature independently
- **Real-time Results**: Live test results and status updates

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Mapbox access token

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Texas-Property-Mapping-Interface
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Mapbox token**
   - Create a `.env` file in the root directory
   - Add your Mapbox access token:
   ```
   VITE_MAPBOX_TOKEN=your_mapbox_token_here
   ```

4. **Add Travis County data**
   - Place your Travis County shapefiles in the `public/data/` directory
   - Required files:
     - `parcels.shp` / `parcels.dbf` (land parcel boundaries)
     - `addresses.shp` / `addresses.dbf` (address points)
     - `counties.shp` / `counties.dbf` (county boundaries)
     - `texas.geojson` (Texas boundary)

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Main app: `http://localhost:5173`
   - Test page: Click the "🧪 Test Page" button in the header

## 🧪 Testing

The application includes a comprehensive test page that allows you to:

- **Test Property Submission**: Validate form functionality and data persistence
- **Test Property Deletion**: Verify property removal from storage and map
- **Test Layer Toggle**: Switch between different map visualization modes
- **Test Property Click**: Validate interactive property selection
- **Test Form Validation**: Check form input validation
- **Test Data Persistence**: Verify localStorage functionality

### Running Tests
1. Start the development server
2. Click the "🧪 Test Page" button in the header
3. Use the test controls to validate each feature
4. Monitor test results in real-time

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Mapbox GL JS** for interactive maps
- **Lucide React** for icons

### Key Components
- `App.tsx` - Main application orchestrator
- `Map.tsx` - Mapbox integration and layer management
- `FloatingPropertyForm.tsx` - Property submission form
- `PropertyCard.tsx` - Property detail display
- `LayerToggle.tsx` - Map layer switching
- `SearchFilters.tsx` - Property filtering
- `TestPage.tsx` - Comprehensive testing interface

### Services
- `comprehensiveDataLoader.ts` - Loads and parses shapefile data
- `propertyStorage.ts` - Manages property data persistence
- `propertyDataEnrichment.ts` - Enriches address data with TCAD information
- `shapefileLoader.ts` - Parses shapefile and DBF files

### Data Flow
1. **Data Loading**: Shapefiles loaded and parsed on app startup
2. **Property Submission**: Form data geocoded and stored locally
3. **Map Rendering**: Properties displayed as interactive markers
4. **Layer Management**: Different visualization modes for property data
5. **User Interaction**: Click handlers for property details and map navigation

## 🎨 UI/UX Features

### Responsive Design
- Mobile-friendly layout with responsive grid system
- Collapsible sidebar for smaller screens
- Touch-friendly interactive elements

### Visual Feedback
- Loading states for data operations
- Success/error messages for user actions
- Hover effects and transitions
- Color-coded property types and status

### Accessibility
- Keyboard navigation support
- Screen reader friendly labels
- High contrast color schemes
- Focus management for interactive elements

## 🔧 Configuration

### Environment Variables
```env
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

### Map Configuration
- Default center: Austin, TX (30.2672, -97.7431)
- Default zoom: 10
- Map style: Mapbox Streets v12

### Data Limits
- Enriched properties: 50 (for performance)
- Submitted properties: Unlimited (localStorage dependent)
- Map layers: Optimized for smooth rendering

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel/Netlify
1. Connect your repository to Vercel or Netlify
2. Set environment variables in the deployment platform
3. Deploy automatically on git push

## 📊 Performance

### Optimizations
- Lazy loading of map layers
- Efficient data parsing and caching
- Optimized GeoJSON structures
- Minimal re-renders with React optimization

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the test page for functionality validation
2. Review browser console for error messages
3. Verify Mapbox token configuration
4. Ensure Travis County data files are properly placed

## 🎯 Future Enhancements

- **Backend Integration**: Supabase or FastAPI backend
- **Advanced Filtering**: More sophisticated search capabilities
- **Data Export**: CSV/Excel export functionality
- **User Authentication**: Multi-user support
- **Real-time Updates**: WebSocket integration for live data
- **Mobile App**: React Native version
- **Advanced Analytics**: Property market analysis tools
