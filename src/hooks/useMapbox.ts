import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import type { MapViewport, Property } from '../types';

// Debug: Log the token (first few characters only)
const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiYnJhZHlpcndpbiIsImEiOiJjbHhoMHdnengxOWNoMnFwdDl3OHJzMjdnIn0.h1jF3M0Xq5ufU2klu3V5Tw';
console.log('Mapbox token found:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

mapboxgl.accessToken = token;

export const useMapbox = (containerId: string) => {
  console.log('=== USE MAPBOX HOOK CALLED ===');
  console.log('Container ID passed to hook:', containerId);
  
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [viewport, setViewport] = useState<MapViewport>({
    latitude: 31.9686, // Texas center coordinates
    longitude: -99.9018,
    zoom: 6.5, // Zoom level 6-7 as requested
    bearing: 0,
    pitch: 0,
  });

  // Callback for when map is ready
  const onMapReady = useRef<(() => void) | null>(null);

  const setMapReadyCallback = useCallback((callback: () => void) => {
    onMapReady.current = callback;
  }, []);

  const initializeMap = useCallback(() => {
    console.log('=== MAP INITIALIZATION START ===');
    console.log('Container ID:', containerId);
    console.log('Mapbox token available:', !!mapboxgl.accessToken);
    console.log('Token length:', mapboxgl.accessToken?.length || 0);
    console.log('Token starts with:', mapboxgl.accessToken?.substring(0, 20) || 'NO TOKEN');
    
    if (mapRef.current) {
      console.log('Map already exists, returning');
      return;
    }

    if (!mapboxgl.accessToken) {
      console.error('❌ No Mapbox access token found');
      return;
    }

    // Test the token by making a simple request
    console.log('Testing Mapbox token...');
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=${mapboxgl.accessToken}`)
      .then(response => {
        if (response.ok) {
          console.log('✅ Mapbox token is valid');
        } else {
          console.error('❌ Mapbox token validation failed:', response.status);
        }
      })
      .catch(error => {
        console.error('❌ Error testing Mapbox token:', error);
      });

    try {
      console.log('Creating new Mapbox map...');
      
      // Check if container exists
      const container = document.getElementById(containerId);
      console.log('Container element found:', !!container);
      if (!container) {
        console.error('❌ Container element not found:', containerId);
        return;
      }

      const newMap = new mapboxgl.Map({
        container: containerId,
        style: 'mapbox://styles/mapbox/streets-v12', // Using streets-v12 as in tutorial
        center: [-99.9018, 31.9686], // Texas center coordinates
        zoom: 6.5, // Zoom level 6-7 as requested
      });

      console.log('✅ Map created successfully');

      // Add navigation controls
      newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
      console.log('✅ Navigation controls added');
      
      // Add fullscreen control
      newMap.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      console.log('✅ Fullscreen control added');

      // Add geolocate control
      newMap.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
          showUserHeading: true,
        }),
        'top-right'
      );
      console.log('✅ Geolocate control added');

      // Handle map events
      newMap.on('move', () => {
        const center = newMap.getCenter();
        setViewport(prev => ({
          ...prev,
          latitude: center.lat,
          longitude: center.lng,
          zoom: newMap.getZoom(),
          bearing: newMap.getBearing(),
          pitch: newMap.getPitch(),
        }));
      });

      // Add load event listener - this is the key event for adding layers
      newMap.on('load', () => {
        console.log('🎉 Map loaded successfully!');
        console.log('Map initialization complete');
        
        // Call the ready callback if it exists
        if (onMapReady.current) {
          onMapReady.current();
        }
      });

      // Add error event listener
      newMap.on('error', (e) => {
        console.error('❌ Mapbox error:', e);
        console.error('Error details:', e.error);
      });

      // Add source data event listener
      newMap.on('sourcedata', (e) => {
        console.log('Source data event:', e);
        if (e.isSourceLoaded) {
          console.log('✅ Source loaded:', e.sourceId);
        }
      });

      // Add style data event listener
      newMap.on('styledata', (e) => {
        console.log('Style data event:', e);
      });

      // Add idle event listener
      newMap.on('idle', () => {
        console.log('Map is idle (all tiles loaded)');
      });

      // Add render event listener
      newMap.on('render', () => {
        console.log('Map is rendering');
      });

      // Add data event listener
      newMap.on('data', (e) => {
        console.log('Data event:', e);
      });

      // Add source load event listener
      newMap.on('sourceload', (e) => {
        console.log('Source load event:', e);
      });

      // Add source error event listener
      newMap.on('sourceerror', (e) => {
        console.error('Source error event:', e);
      });

      mapRef.current = newMap;
      setMap(newMap);
      console.log('✅ Map reference set');

      return newMap;
    } catch (error) {
      console.error('❌ Error creating map:', error);
      return null;
    }
  }, [containerId, viewport]);

  const addPropertyLayer = useCallback((properties: Property[]) => {
    console.log('Adding property layer with', properties.length, 'properties');
    if (!map) {
      console.log('Map not ready yet');
      return;
    }

    try {
      // Remove existing property layer if it exists
      if (map.getLayer && map.getLayer('properties')) {
        map.removeLayer('properties');
      }
      if (map.getSource && map.getSource('properties')) {
        map.removeSource('properties');
      }

      // Create GeoJSON features from properties
      const features = properties.map(property => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [property.coordinates.lng, property.coordinates.lat],
        },
        properties: {
          value: property.marketValue,
          type: property.propertyType,
          ...property,
        },
      }));

      // Add source
      map.addSource('properties', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
      });

      // Add circle layer for properties
      map.addLayer({
        id: 'properties',
        type: 'circle',
        source: 'properties',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'value'],
            0, 4,
            1000000, 12,
          ],
          'circle-color': [
            'match',
            ['get', 'type'],
            'residential', '#3b82f6',
            'commercial', '#10b981',
            'industrial', '#f59e0b',
            'agricultural', '#8b5cf6',
            'vacant', '#6b7280',
            '#6b7280',
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Add hover effect
      map.on('mouseenter', 'properties', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'properties', () => {
        map.getCanvas().style.cursor = '';
      });

      console.log('Property layer added successfully');
    } catch (error) {
      console.error('Error adding property layer:', error);
    }
  }, [map]);

  const addParcelLayer = useCallback((properties: Property[]) => {
    console.log('Adding parcel layer with', properties.length, 'properties');
    if (!map) return;

    try {
      // Remove existing layers
      if (map.getLayer && map.getLayer('parcels')) map.removeLayer('parcels');
      if (map.getSource && map.getSource('parcels')) map.removeSource('parcels');

      // Create polygon features from properties (simplified for demo)
      const features = properties.map(property => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [property.coordinates.lng - 0.001, property.coordinates.lat - 0.001],
            [property.coordinates.lng + 0.001, property.coordinates.lat - 0.001],
            [property.coordinates.lng + 0.001, property.coordinates.lat + 0.001],
            [property.coordinates.lng - 0.001, property.coordinates.lat + 0.001],
            [property.coordinates.lng - 0.001, property.coordinates.lat - 0.001]
          ]]
        },
        properties: {
          value: property.marketValue,
          type: property.propertyType,
          ...property,
        },
      }));

      map.addSource('parcels', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
      });

      map.addLayer({
        id: 'parcels',
        type: 'fill',
        source: 'parcels',
        paint: {
          'fill-color': [
            'match',
            ['get', 'type'],
            'residential', '#3b82f6',
            'commercial', '#10b981',
            'industrial', '#f59e0b',
            'agricultural', '#8b5cf6',
            'vacant', '#6b7280',
            '#6b7280',
          ],
          'fill-opacity': 0.6,
        },
      });

      map.addLayer({
        id: 'parcels-outline',
        type: 'line',
        source: 'parcels',
        paint: {
          'line-color': '#1f2937',
          'line-width': 1,
        },
      });

      console.log('Parcel layer added successfully');
    } catch (error) {
      console.error('Error adding parcel layer:', error);
    }
  }, [map]);

  const addClusterLayer = useCallback((properties: Property[]) => {
    console.log('Adding cluster layer with', properties.length, 'properties');
    if (!map) return;

    try {
      // Remove existing layers
      if (map.getLayer && map.getLayer('clusters')) map.removeLayer('clusters');
      if (map.getSource && map.getSource('clusters')) map.removeSource('clusters');

      const features = properties.map(property => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [property.coordinates.lng, property.coordinates.lat],
        },
        properties: {
          value: property.marketValue,
          type: property.propertyType,
          ...property,
        },
      }));

      map.addSource('clusters', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'clusters',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            100,
            '#f1f075',
            750,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100,
            30,
            750,
            40
          ]
        }
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'clusters',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });

      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'clusters',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match',
            ['get', 'type'],
            'residential', '#3b82f6',
            'commercial', '#10b981',
            'industrial', '#f59e0b',
            'agricultural', '#8b5cf6',
            'vacant', '#6b7280',
            '#6b7280',
          ],
          'circle-radius': 8,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      });

      console.log('Cluster layer added successfully');
    } catch (error) {
      console.error('Error adding cluster layer:', error);
    }
  }, [map]);

  const addHeatmapLayer = useCallback((properties: Property[]) => {
    console.log('Adding heatmap layer with', properties.length, 'properties');
    if (!map) return;

    try {
      // Remove existing layers
      if (map.getLayer && map.getLayer('heatmap')) map.removeLayer('heatmap');
      if (map.getSource && map.getSource('heatmap')) map.removeSource('heatmap');

      const features = properties.map(property => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [property.coordinates.lng, property.coordinates.lat],
        },
        properties: {
          value: property.marketValue,
          type: property.propertyType,
          ...property,
        },
      }));

      map.addSource('heatmap', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
      });

      map.addLayer({
        id: 'heatmap',
        type: 'heatmap',
        source: 'heatmap',
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'value'],
            0, 0,
            1000000, 1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            9, 3
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,
            9, 20
          ],
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 1,
            9, 0.8
          ]
        }
      });

      console.log('Heatmap layer added successfully');
    } catch (error) {
      console.error('Error adding heatmap layer:', error);
    }
  }, [map]);

  const flyToProperty = useCallback((property: Property) => {
    if (!map) return;

    map.flyTo({
      center: [property.coordinates.lng, property.coordinates.lat],
      zoom: 16,
      duration: 2000,
    });
  }, [map]);

  const addTravisCountyBoundary = useCallback(() => {
    if (!map) return;

    // Add Travis County boundary layer
    map.addSource('travis-county-boundary', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-98.0, 30.0],
              [-97.0, 30.0],
              [-97.0, 31.0],
              [-98.0, 31.0],
              [-98.0, 30.0],
            ],
          ],
        },
      },
    });

    map.addLayer({
      id: 'travis-county-boundary',
      type: 'line',
      source: 'travis-county-boundary',
      paint: {
        'line-color': '#1e40af',
        'line-width': 2,
        'line-opacity': 0.8,
      },
    });
  }, [map]);

  useEffect(() => {
    console.log('=== USE MAPBOX USE EFFECT ===');
    console.log('useMapbox useEffect - initializing map');
    const newMap = initializeMap();
    
    if (newMap) {
      newMap.on('load', () => {
        console.log('🎉 Map loaded, adding Travis County boundary');
        addTravisCountyBoundary();
      });
    }

    return () => {
      console.log('useMapbox cleanup - removing map');
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMap(null);
      }
    };
  }, [initializeMap, addTravisCountyBoundary]);

  return {
    map,
    viewport,
    addPropertyLayer,
    addParcelLayer,
    addClusterLayer,
    addHeatmapLayer,
    flyToProperty,
    addTravisCountyBoundary,
    setMapReadyCallback,
  };
}; 