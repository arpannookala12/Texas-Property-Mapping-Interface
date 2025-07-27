import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { loadComprehensiveData, type ComprehensiveData } from '../services/comprehensiveDataLoader';
import 'mapbox-gl/dist/mapbox-gl.css';

export const ComprehensiveTest: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [data, setData] = useState<ComprehensiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLayers, setActiveLayers] = useState({
    texasBoundary: false,
    counties: false,
    addresses: false,
    parcels: false
  });
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  console.log('=== COMPREHENSIVE TEST START ===');

  const addDebugInfo = (info: string) => {
    console.log(info);
    setDebugInfo(prev => [...prev, info]);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    initializeMap();
  }, []);

  const loadData = async () => {
    console.log('Loading comprehensive data...');
    setLoading(true);
    setError(null);
    setDebugInfo([]);
    
    try {
      const comprehensiveData = await loadComprehensiveData();
      console.log('Data loaded successfully:', comprehensiveData);
      setData(comprehensiveData);
      
      // Debug geometry information
      if (comprehensiveData.texasBoundary) {
        addDebugInfo(`Texas boundary: ${comprehensiveData.texasBoundary.geometry.type} with ${comprehensiveData.texasBoundary.geometry.coordinates[0].length} points`);
        addDebugInfo(`Texas coords sample: ${JSON.stringify(comprehensiveData.texasBoundary.geometry.coordinates[0].slice(0, 3))}`);
      }
      
      if (comprehensiveData.counties.length > 0) {
        const sampleCounty = comprehensiveData.counties[0];
        addDebugInfo(`Sample county: ${sampleCounty.name} - ${sampleCounty.geometry.type} with ${sampleCounty.geometry.coordinates[0].length} points`);
        addDebugInfo(`County coords sample: ${JSON.stringify(sampleCounty.geometry.coordinates[0].slice(0, 3))}`);
      }
      
      if (comprehensiveData.parcels.length > 0) {
        const sampleParcel = comprehensiveData.parcels[0];
        addDebugInfo(`Sample parcel: ${sampleParcel.SITE_ADDR} - ${sampleParcel.geometry.type} with ${sampleParcel.geometry.coordinates[0].length} points`);
        addDebugInfo(`Parcel coords sample: ${JSON.stringify(sampleParcel.geometry.coordinates[0].slice(0, 3))}`);
      }
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    console.log('Initializing test map...');
    
    if (map.current) return;
    if (!mapContainer.current) return;

    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      setError('No Mapbox token found');
      return;
    }

    mapboxgl.accessToken = token;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-99.9018, 31.9686], // Texas
        zoom: 6.5
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        console.log('✅ Test map loaded successfully');
        addDebugInfo('Map loaded successfully');
      });

      map.current.on('error', (e) => {
        console.error('❌ Map error:', e);
        setError(`Map error: ${e.error}`);
      });

    } catch (error) {
      console.error('Error creating map:', error);
      setError('Error creating map');
    }
  };

  const addTexasBoundary = () => {
    if (!map.current || !data?.texasBoundary) return;

    try {
      // Remove existing layer
      if (map.current.getLayer('texas-boundary')) {
        map.current.removeLayer('texas-boundary');
      }
      if (map.current.getSource('texas-boundary')) {
        map.current.removeSource('texas-boundary');
      }

      // Debug the geometry
      const geometry = data.texasBoundary.geometry;
      
      // Validate geometry exists and has required properties
      if (!geometry || !geometry.type || !geometry.coordinates) {
        addDebugInfo('❌ Error: Texas boundary geometry is invalid or missing');
        setError('Texas boundary geometry is invalid');
        return;
      }
      
      addDebugInfo(`Adding Texas boundary: ${geometry.type}`);
      addDebugInfo(`Coordinates length: ${geometry.coordinates[0].length}`);
      addDebugInfo(`First 3 coords: ${JSON.stringify(geometry.coordinates[0].slice(0, 3))}`);
      addDebugInfo(`Last 3 coords: ${JSON.stringify(geometry.coordinates[0].slice(-3))}`);

      // Check if coordinates are in valid range for Texas
      const coords = geometry.coordinates[0];
      const lngs = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      
      addDebugInfo(`Texas bounds: Lng ${minLng} to ${maxLng}, Lat ${minLat} to ${maxLat}`);
      
      // Check if coordinates look reasonable for Texas
      if (minLng < -107 || maxLng > -93 || minLat < 25 || maxLat > 37) {
        addDebugInfo('⚠️ WARNING: Coordinates seem outside Texas bounds - possible coordinate system issue');
      }

      map.current.addSource('texas-boundary', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: geometry,
          properties: {}
        }
      });

      map.current.addLayer({
        id: 'texas-boundary',
        type: 'line',
        source: 'texas-boundary',
        paint: {
          'line-color': '#1f2937',
          'line-width': 3,
          'line-opacity': 0.9
        }
      });

      setActiveLayers(prev => ({ ...prev, texasBoundary: true }));
      addDebugInfo('✅ Texas boundary added');
    } catch (error) {
      console.error('Error adding Texas boundary:', error);
      setError('Error adding Texas boundary');
      addDebugInfo(`❌ Error: ${error}`);
    }
  };

  const addCountyBoundaries = () => {
    if (!map.current || !data?.counties) return;

    try {
      // Remove existing layer
      if (map.current.getLayer('county-boundaries')) {
        map.current.removeLayer('county-boundaries');
      }
      if (map.current.getSource('county-boundaries')) {
        map.current.removeSource('county-boundaries');
      }

      // Filter out invalid geometries
      const validCounties = data.counties.filter(county => 
        county.geometry && 
        county.geometry.type === 'Polygon' && 
        county.geometry.coordinates && 
        county.geometry.coordinates.length > 0
      );

      if (validCounties.length === 0) {
        addDebugInfo('❌ Error: No valid county geometries found');
        setError('No valid county geometries found');
        return;
      }

      // Debug sample counties
      const sampleCounties = validCounties.slice(0, 3);
      sampleCounties.forEach((county, i) => {
        addDebugInfo(`County ${i}: ${county.name} - ${county.geometry.coordinates[0].length} points`);
        addDebugInfo(`  Coords: ${JSON.stringify(county.geometry.coordinates[0].slice(0, 2))}`);
      });

      // Create unique IDs to avoid duplicate key issues
      const uniqueCounties = validCounties.map((county, index) => ({
        ...county,
        id: `county-${index}-${Date.now()}`
      }));

      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: uniqueCounties.map(county => ({
          type: 'Feature' as const,
          geometry: county.geometry,
          properties: {
            id: county.id,
            name: county.name,
            fips: county.fips
          }
        }))
      };

      map.current.addSource('county-boundaries', {
        type: 'geojson',
        data: geojson
      });

      map.current.addLayer({
        id: 'county-boundaries',
        type: 'line',
        source: 'county-boundaries',
        paint: {
          'line-color': '#6b7280',
          'line-width': 1,
          'line-opacity': 0.7
        }
      });

      setActiveLayers(prev => ({ ...prev, counties: true }));
      addDebugInfo(`✅ County boundaries added: ${uniqueCounties.length} counties`);
    } catch (error) {
      console.error('Error adding county boundaries:', error);
      setError('Error adding county boundaries');
      addDebugInfo(`❌ Error: ${error}`);
    }
  };

  const addAddresses = () => {
    if (!map.current || !data?.addresses) return;

    try {
      // Remove existing layer
      if (map.current.getLayer('addresses')) {
        map.current.removeLayer('addresses');
      }
      if (map.current.getSource('addresses')) {
        map.current.removeSource('addresses');
      }

      // Filter out invalid geometries
      const validAddresses = data.addresses.filter(address => 
        address.geometry && 
        address.geometry.type === 'Point' && 
        address.geometry.coordinates && 
        address.geometry.coordinates.length >= 2
      );

      if (validAddresses.length === 0) {
        addDebugInfo('❌ Error: No valid address geometries found');
        setError('No valid address geometries found');
        return;
      }

      // Debug sample addresses
      const sampleAddresses = validAddresses.slice(0, 3);
      sampleAddresses.forEach((addr, i) => {
        addDebugInfo(`Address ${i}: ${addr.address} at [${addr.coordinates.lng}, ${addr.coordinates.lat}]`);
      });

      // Create unique IDs to avoid duplicate key issues
      const uniqueAddresses = validAddresses.map((address, index) => ({
        ...address,
        id: `addr-${index}-${Date.now()}`
      }));

      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: uniqueAddresses.map(address => ({
          type: 'Feature' as const,
          geometry: address.geometry,
          properties: {
            id: address.id,
            address: address.address,
            city: address.city,
            state: address.state,
            zip: address.zip
          }
        }))
      };

      map.current.addSource('addresses', {
        type: 'geojson',
        data: geojson
      });

      map.current.addLayer({
        id: 'addresses',
        type: 'circle',
        source: 'addresses',
        paint: {
          'circle-radius': 3,
          'circle-color': '#ef4444',
          'circle-opacity': 0.8
        }
      });

      setActiveLayers(prev => ({ ...prev, addresses: true }));
      addDebugInfo(`✅ Addresses added: ${uniqueAddresses.length} addresses`);
    } catch (error) {
      console.error('Error adding addresses:', error);
      setError('Error adding addresses');
      addDebugInfo(`❌ Error: ${error}`);
    }
  };

  const addParcels = () => {
    if (!map.current || !data?.parcels) return;

    try {
      // Remove existing layers
      if (map.current.getLayer('parcels-fill')) {
        map.current.removeLayer('parcels-fill');
      }
      if (map.current.getLayer('parcels-outline')) {
        map.current.removeLayer('parcels-outline');
      }
      if (map.current.getSource('parcels')) {
        map.current.removeSource('parcels');
      }

      // Filter out invalid geometries
      const validParcels = data.parcels.filter(parcel => 
        parcel.geometry && 
        parcel.geometry.type === 'Polygon' && 
        parcel.geometry.coordinates && 
        parcel.geometry.coordinates.length > 0 &&
        parcel.geometry.coordinates[0].length >= 3
      );

      if (validParcels.length === 0) {
        addDebugInfo('❌ Error: No valid parcel geometries found');
        setError('No valid parcel geometries found');
        return;
      }

      // Debug sample parcels
      const sampleParcels = validParcels.slice(0, 3);
      sampleParcels.forEach((parcel, i) => {
        addDebugInfo(`Parcel ${i}: ${parcel.SITE_ADDR} - ${parcel.geometry.coordinates[0].length} points`);
        addDebugInfo(`  Coords: ${JSON.stringify(parcel.geometry.coordinates[0].slice(0, 2))}`);
        addDebugInfo(`  Value: $${parcel.TOTAL_VAL}, Type: ${parcel.PROP_TYPE}`);
      });

      // Create unique IDs to avoid duplicate key issues
      const uniqueParcels = validParcels.map((parcel, index) => ({
        ...parcel,
        PROP_ID: `parcel-${index}-${Date.now()}`
      }));

      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: uniqueParcels.map(parcel => ({
          type: 'Feature' as const,
          geometry: parcel.geometry,
          properties: {
            id: parcel.PROP_ID,
            address: parcel.SITE_ADDR,
            propertyType: parcel.PROP_TYPE,
            marketValue: parcel.TOTAL_VAL
          }
        }))
      };

      map.current.addSource('parcels', {
        type: 'geojson',
        data: geojson
      });

      // Add fill layer
      map.current.addLayer({
        id: 'parcels-fill',
        type: 'fill',
        source: 'parcels',
        paint: {
          'fill-color': [
            'match',
            ['get', 'propertyType'],
            'residential', 'rgba(59, 130, 246, 0.3)',
            'commercial', 'rgba(16, 185, 129, 0.3)',
            'industrial', 'rgba(245, 158, 11, 0.3)',
            'agricultural', 'rgba(139, 92, 246, 0.3)',
            'vacant', 'rgba(107, 114, 128, 0.3)',
            'rgba(59, 130, 246, 0.3)'
          ],
          'fill-opacity': 0.6
        }
      });

      // Add outline layer
      map.current.addLayer({
        id: 'parcels-outline',
        type: 'line',
        source: 'parcels',
        paint: {
          'line-color': [
            'match',
            ['get', 'propertyType'],
            'residential', '#3b82f6',
            'commercial', '#10b981',
            'industrial', '#f59e0b',
            'agricultural', '#8b5cf6',
            'vacant', '#6b7280',
            '#3b82f6'
          ],
          'line-width': 1,
          'line-opacity': 0.8
        }
      });

      setActiveLayers(prev => ({ ...prev, parcels: true }));
      addDebugInfo(`✅ Parcels added: ${uniqueParcels.length} parcels`);
    } catch (error) {
      console.error('Error adding parcels:', error);
      setError('Error adding parcels');
      addDebugInfo(`❌ Error: ${error}`);
    }
  };

  const clearAllLayers = () => {
    if (!map.current) return;

    const layersToRemove = [
      'texas-boundary', 'county-boundaries', 'addresses', 
      'parcels-fill', 'parcels-outline'
    ];
    
    layersToRemove.forEach(layerId => {
      if (map.current!.getLayer(layerId)) {
        map.current!.removeLayer(layerId);
      }
    });

    const sourcesToRemove = [
      'texas-boundary', 'county-boundaries', 'addresses', 'parcels'
    ];
    
    sourcesToRemove.forEach(sourceId => {
      if (map.current!.getSource(sourceId)) {
        map.current!.removeSource(sourceId);
      }
    });

    setActiveLayers({
      texasBoundary: false,
      counties: false,
      addresses: false,
      parcels: false
    });

    addDebugInfo('✅ All layers cleared');
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Comprehensive Data Test Interface</h2>
      
      {/* Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Data Status:</h3>
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span>Loading data...</span>
          </div>
        ) : error ? (
          <div className="text-red-600">Error: {error}</div>
        ) : data ? (
          <div className="text-green-600">
            ✅ Data loaded successfully
            <div className="text-sm text-gray-600 mt-1">
              • {data.parcels.length} parcels
              <br />
              • {data.addresses.length} addresses
              <br />
              • {data.counties.length} counties
              <br />
              • Texas boundary: {data.texasBoundary ? '✅' : '❌'}
            </div>
          </div>
        ) : (
          <div className="text-gray-600">No data loaded</div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={addTexasBoundary}
          disabled={!data?.texasBoundary}
          className={`p-3 rounded-lg border transition-colors ${
            activeLayers.texasBoundary 
              ? 'bg-green-100 border-green-300 text-green-800' 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          } ${!data?.texasBoundary ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Texas Boundary
        </button>

        <button
          onClick={addCountyBoundaries}
          disabled={!data?.counties}
          className={`p-3 rounded-lg border transition-colors ${
            activeLayers.counties 
              ? 'bg-green-100 border-green-300 text-green-800' 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          } ${!data?.counties ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          County Boundaries
        </button>

        <button
          onClick={addAddresses}
          disabled={!data?.addresses}
          className={`p-3 rounded-lg border transition-colors ${
            activeLayers.addresses 
              ? 'bg-green-100 border-green-300 text-green-800' 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          } ${!data?.addresses ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Address Points
        </button>

        <button
          onClick={addParcels}
          disabled={!data?.parcels}
          className={`p-3 rounded-lg border transition-colors ${
            activeLayers.parcels 
              ? 'bg-green-100 border-green-300 text-green-800' 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          } ${!data?.parcels ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Parcel Boundaries
        </button>
      </div>

      <button
        onClick={clearAllLayers}
        className="mb-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Clear All Layers
      </button>

      {/* Map */}
      <div 
        ref={mapContainer}
        className="w-full h-96 border-2 border-blue-500 rounded-lg"
        style={{ backgroundColor: '#f0f0f0' }}
      />
      
      {/* Debug Info */}
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Information:</h3>
        <div className="max-h-40 overflow-y-auto text-sm space-y-1">
          {debugInfo.length === 0 ? (
            <div className="text-gray-500">No debug info yet. Click buttons to see details.</div>
          ) : (
            debugInfo.map((info, index) => (
              <div key={index} className="text-gray-700">
                {info}
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Instructions */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2">Test Instructions:</h3>
        <ol className="text-sm space-y-1">
          <li>1. Wait for data to load (check status above)</li>
          <li>2. Click each button to add layers one by one</li>
          <li>3. Check debug info below for detailed analysis</li>
          <li>4. Look for coordinate system warnings</li>
          <li>5. Use "Clear All Layers" to reset</li>
        </ol>
      </div>
    </div>
  );
}; 