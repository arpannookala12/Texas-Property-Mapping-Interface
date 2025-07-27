import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export const MapboxTest: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    console.log('=== MAPBOX TEST START ===');
    
    // Check if map already exists
    if (map.current) return;

    // Check if container exists
    if (!mapContainer.current) {
      console.error('Map container not found');
      return;
    }

    // Check token
    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    console.log('Token available:', !!token);
    console.log('Token starts with:', token?.substring(0, 20) || 'NO TOKEN');

    if (!token) {
      console.error('No Mapbox token found');
      return;
    }

    // Set access token
    mapboxgl.accessToken = token;

    try {
      console.log('Creating test map...');
      
      // Create a simple map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-99.9018, 31.9686], // Texas
        zoom: 6
      });

      console.log('✅ Test map created successfully');

      // Add basic controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      console.log('✅ Navigation control added');

      // Add event listeners
      map.current.on('load', () => {
        console.log('🎉 Test map loaded successfully!');
      });

      map.current.on('error', (e) => {
        console.error('❌ Test map error:', e);
      });

      map.current.on('render', () => {
        console.log('Test map is rendering');
      });

      map.current.on('idle', () => {
        console.log('Test map is idle (all tiles loaded)');
      });

    } catch (error) {
      console.error('❌ Error creating test map:', error);
    }

    // Cleanup
    return () => {
      if (map.current) {
        console.log('Cleaning up test map');
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Mapbox Test Interface</h2>
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          This is a simple test to verify Mapbox is working correctly.
        </p>
      </div>
      
      <div 
        ref={mapContainer}
        className="w-full h-96 border-2 border-blue-500 rounded-lg"
        style={{
          backgroundColor: '#f0f0f0',
          position: 'relative'
        }}
      />
      
      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Test Instructions:</h3>
        <ul className="text-sm space-y-1">
          <li>• You should see a map of Texas above</li>
          <li>• You should be able to zoom and pan</li>
          <li>• Check the console for debug messages</li>
          <li>• If you see a gray background, the map isn't loading</li>
        </ul>
      </div>
    </div>
  );
}; 