import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Property, BuildingFootprint } from '../types';
import type { ComprehensiveData, AddressPoint, CountyBoundary, TexasBoundary } from '../services/comprehensiveDataLoader';
import type { MapLayerType } from './LayerToggle';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapProps {
  properties?: Property[];
  comprehensiveData?: ComprehensiveData;
  onPropertyClick?: (property: Property) => void;
  className?: string;
  layerType?: MapLayerType;
  center?: { lat: number; lng: number };
  zoom?: number;
  onMapReady?: (map: mapboxgl.Map) => void; // New prop to expose map instance
}

export const Map: React.FC<MapProps> = ({
  properties = [],
  comprehensiveData,
  onPropertyClick,
  className = '',
  layerType = 'all',
  center,
  zoom,
  onMapReady
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);

  console.log('🗺️ Map component rendering with:', {
    propertiesCount: properties.length,
    layerType,
    hasComprehensiveData: !!comprehensiveData,
    comprehensiveDataDetails: comprehensiveData ? {
      parcels: comprehensiveData.parcels.length,
      addresses: comprehensiveData.addresses.length,
      counties: comprehensiveData.counties.length,
      buildings: comprehensiveData.buildings?.length || 0,
      hasTexasBoundary: !!comprehensiveData.texasBoundary
    } : null
  });

  console.log('Comprehensive data available:', !!comprehensiveData);

  useEffect(() => {
    console.log('=== MAP COMPONENT INITIALIZATION ===');
    
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

    if (!token) {
      console.error('No Mapbox token found');
      return;
    }

    // Set access token
    mapboxgl.accessToken = token;

    try {
      console.log('Creating map...');
      
      // Create map with simple configuration
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: center || [-99.9018, 31.9686], // Texas
        zoom: zoom || 6.5
      });

      console.log('✅ Map created successfully');

      // Add basic controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      map.current.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      }), 'top-right');

      console.log('✅ Controls added');

      // Create popup for hover effects
      popup.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: '300px'
      });

      // Add event listeners
      map.current.on('load', () => {
        console.log('🎉 Map loaded successfully!');
        addAllLayers();
        
        // Notify parent component that map is ready
        if (onMapReady && map.current) {
          onMapReady(map.current);
        }
      });

      map.current.on('error', (e) => {
        console.error('❌ Map error:', e);
      });

      map.current.on('render', () => {
        console.log('Map is rendering');
      });

      map.current.on('idle', () => {
        console.log('Map is idle (all tiles loaded)');
      });

    } catch (error) {
      console.error('❌ Error creating map:', error);
    }

    // Cleanup
    return () => {
      if (map.current) {
        console.log('Cleaning up map');
        map.current.remove();
        map.current = null;
      }
      if (popup.current) {
        popup.current.remove();
        popup.current = null;
      }
    };
  }, []);

  const addAllLayers = () => {
    if (!map.current || !map.current.isStyleLoaded()) {
      console.log('Map not ready for layers');
      return;
    }

    console.log('Adding layers for type:', layerType);

    try {
      // Remove existing layers and sources
      const layersToRemove = [
        'properties', 'properties-polygons', 'parcel-boundaries', 'submitted-properties', 'submitted-properties-symbols',
        'clusters', 'cluster-count', 'unclustered-point', 'heatmap', 'heatmap-points',
        'addresses', 'county-boundaries', 'texas-boundary',
        'geojson-points', 'buildings-fill', 'buildings-boundaries'
      ];
      
      console.log('🧹 Removing existing layers...');
      layersToRemove.forEach(layerId => {
        if (map.current!.getLayer(layerId)) {
          map.current!.removeLayer(layerId);
          console.log(`  - Removed layer: ${layerId}`);
        }
      });

      const sourcesToRemove = [
        'properties', 'properties-polygons', 'properties-points', 'clusters', 'addresses', 'county-boundaries', 'texas-boundary',
        'geojson-points', 'heatmap', 'buildings'
      ];
      
      console.log('🧹 Removing existing sources...');
      sourcesToRemove.forEach(sourceId => {
        if (map.current!.getSource(sourceId)) {
          map.current!.removeSource(sourceId);
          console.log(`  - Removed source: ${sourceId}`);
        }
      });

      // For "all" layer type, add ALL available layers
      if (layerType === 'all') {
        console.log('🎯 Adding ALL layers for comprehensive view');
        
        // 1. Add Texas boundary first (background)
        if (comprehensiveData?.texasBoundary) {
          console.log('  📍 Adding Texas boundary');
          addTexasBoundary(comprehensiveData.texasBoundary);
        }

        // 2. Add county boundaries
        if (comprehensiveData?.counties) {
          console.log('  📍 Adding county boundaries');
          addCountyBoundaries(comprehensiveData.counties);
        }

        // 3. Add Travis County parcels
        if (comprehensiveData?.parcels) {
          console.log('  📍 Adding parcel boundaries');
          addTravisCountyParcels();
        }

        // 4. Add addresses
        if (comprehensiveData?.addresses) {
          console.log('  📍 Adding address points');
          addAddresses(comprehensiveData.addresses);
        }

        // 5. Add building footprints
        if (comprehensiveData?.buildings && comprehensiveData.buildings.length > 0) {
          console.log('  📍 Adding building footprints');
          addBuildingFootprints(comprehensiveData.buildings);
        }

        // 6. Add submitted properties as GeoJSON points
        if (properties.length > 0) {
          console.log('  📍 Adding submitted properties');
          addPropertyLayers();
        }

        // 7. Add demo GeoJSON points if no submitted properties
        if (properties.length === 0) {
          console.log('  📍 Adding demo GeoJSON points for all layers view');
          addGeoJSONPointsLayer();
        }
      } else {
        // For specific layer types, add background layers first
        console.log(`🎯 Adding specific layer type: ${layerType}`);
        
        if (layerType === 'parcels' || layerType === 'points' || layerType === 'clusters' || layerType === 'heatmap') {
          // Add Texas boundary first (background)
          if (comprehensiveData?.texasBoundary) {
            addTexasBoundary(comprehensiveData.texasBoundary);
          }

          // Add county boundaries
          if (comprehensiveData?.counties) {
            addCountyBoundaries(comprehensiveData.counties);
          }

          // Add Travis County parcels
          if (comprehensiveData?.parcels) {
            addTravisCountyParcels();
          }

          // Add addresses
          if (comprehensiveData?.addresses) {
            addAddresses(comprehensiveData.addresses);
          }
        }

        // Add property layers based on layerType
        switch (layerType) {
          case 'parcels':
            if (properties.length > 0) {
              addPropertyLayers();
            }
            break;
          case 'points':
            addGeoJSONPointsLayer();
            break;
          case 'clusters':
            addClusteredMarkersLayer();
            break;
          case 'heatmap':
            addHeatmapLayer();
            break;
          case 'buildings':
            // Add background layers for buildings too
            if (comprehensiveData?.texasBoundary) {
              addTexasBoundary(comprehensiveData.texasBoundary);
            }
            if (comprehensiveData?.counties) {
              addCountyBoundaries(comprehensiveData.counties);
            }
            if (comprehensiveData?.parcels) {
              addTravisCountyParcels();
            }
            if (comprehensiveData?.addresses) {
              addAddresses(comprehensiveData.addresses);
            }
            // Add building footprints
            if (comprehensiveData?.buildings && comprehensiveData.buildings.length > 0) {
              addBuildingFootprints(comprehensiveData.buildings);
            }
            break;
        }
      }

      console.log(`✅ Completed adding layers for layerType: ${layerType}`);

      // Force a repaint to ensure layers are visible immediately
      setTimeout(() => {
        if (map.current) {
          map.current.triggerRepaint();
          console.log('🔄 Forced map repaint');
        }
      }, 200); // Increased timeout to ensure proper rendering
    } catch (error) {
      console.error('❌ Error adding layers:', error);
    }
  };

  const addTravisCountyParcels = () => {
    if (!map.current || !comprehensiveData?.parcels || comprehensiveData.parcels.length === 0) return;

    console.log('🗺️ Adding Travis County parcels...', comprehensiveData.parcels.length);

    try {
      // Check if source already exists
      if (map.current.getSource('travis-parcels')) {
        console.log('  ⚠️ Travis parcels source already exists, skipping');
        return;
      }

      // Create GeoJSON for Travis County parcels
      const parcelGeojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: comprehensiveData.parcels.map(parcel => ({
          type: 'Feature' as const,
          geometry: parcel.geometry,
          properties: {
            id: parcel.PROP_ID,
            address: parcel.SITE_ADDR,
            marketValue: parcel.TOTAL_VAL || 0,
            owner: parcel.OWNER_NAME,
            propertyType: parcel.PROP_TYPE || 'residential',
            squareFootage: parcel.SQ_FT,
            yearBuilt: parcel.YEAR_BUILT,
            bedrooms: parcel.BEDROOMS,
            bathrooms: parcel.BATHROOMS,
            isParcel: true
          }
        }))
      };

      // Add parcel source
      map.current.addSource('travis-parcels', {
        type: 'geojson',
        data: parcelGeojson
      });

      // Add parcel fill layer
      map.current.addLayer({
        id: 'travis-parcels-fill',
        type: 'fill',
        source: 'travis-parcels',
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.3,
          'fill-outline-color': '#1e40af'
        }
      });

      // Add parcel boundary layer
      map.current.addLayer({
        id: 'travis-parcels-boundary',
        type: 'line',
        source: 'travis-parcels',
        paint: {
          'line-color': '#1e40af',
          'line-width': 1,
          'line-opacity': 0.6
        }
      });

      // Add hover effects and click handlers
      addHoverEffects('travis-parcels-fill');
      addHoverEffects('travis-parcels-boundary');
      addClickHandlers('travis-parcels-fill');
      addClickHandlers('travis-parcels-boundary');

      console.log('✅ Travis County parcels added successfully');
    } catch (error) {
      console.error('❌ Error adding Travis County parcels:', error);
    }
  };

  const addTexasBoundary = (texasBoundary: TexasBoundary) => {
    if (!map.current) return;

    console.log('🗺️ Adding Texas boundary...');

    try {
      // Check if source already exists
      if (map.current.getSource('texas-boundary')) {
        console.log('  ⚠️ Texas boundary source already exists, skipping');
        return;
      }

      // Add Texas boundary source
      map.current.addSource('texas-boundary', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: texasBoundary.geometry,
            properties: {}
          }]
        }
      });

      // Add Texas boundary layer
      map.current.addLayer({
        id: 'texas-boundary',
        type: 'line',
        source: 'texas-boundary',
        paint: {
          'line-color': '#1f2937',
          'line-width': 3,
          'line-opacity': 0.8
        }
      });

      console.log('✅ Texas boundary added successfully');
    } catch (error) {
      console.error('❌ Error adding Texas boundary:', error);
    }
  };

  const addCountyBoundaries = (counties: CountyBoundary[]) => {
    if (!map.current) return;

    console.log('🗺️ Adding county boundaries...', counties.length);

    try {
      // Check if source already exists
      if (map.current.getSource('county-boundaries')) {
        console.log('  ⚠️ County boundaries source already exists, skipping');
        return;
      }

      // Add county boundaries source
      map.current.addSource('county-boundaries', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: counties.map(county => ({
            type: 'Feature',
            geometry: county.geometry,
            properties: {
              id: county.id,
              name: county.name,
              fips: county.fips
            }
          }))
        }
      });

      // Add county boundaries layer
      map.current.addLayer({
        id: 'county-boundaries',
        type: 'line',
        source: 'county-boundaries',
        paint: {
          'line-color': '#374151',
          'line-width': 2,
          'line-opacity': 0.6
        }
      });

      console.log('✅ County boundaries added successfully');
    } catch (error) {
      console.error('❌ Error adding county boundaries:', error);
    }
  };

  const addAddresses = (addresses: AddressPoint[]) => {
    if (!map.current) return;

    console.log('🗺️ Adding addresses...', addresses.length);

    try {
      // Check if source already exists
      if (map.current.getSource('addresses')) {
        console.log('  ⚠️ Addresses source already exists, skipping');
        return;
      }

      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: addresses.map(address => ({
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
          'circle-radius': 2,
          'circle-color': '#ef4444',
          'circle-opacity': 0.7
        }
      });

      // Add hover effects for addresses
      map.current.on('mouseenter', 'addresses', (e) => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
        
        if (e.features && e.features[0] && popup.current) {
          const feature = e.features[0];
          const coordinates = (feature.geometry as any).coordinates.slice();
          
          const description = `
            <div class="p-2">
              <h3 class="font-semibold text-gray-900">Address Point</h3>
              <p class="text-sm text-gray-600">${feature.properties?.address || 'Unknown Address'}</p>
              <p class="text-sm text-gray-600">${feature.properties?.city}, ${feature.properties?.state} ${feature.properties?.zip}</p>
            </div>
          `;
          
          popup.current
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(map.current!);
        }
      });

      map.current.on('mouseleave', 'addresses', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
        if (popup.current) {
          popup.current.remove();
        }
      });

      console.log('✅ Addresses added successfully');
    } catch (error) {
      console.error('❌ Error adding addresses:', error);
    }
  };

  const addPropertyLayers = () => {
    if (!map.current) return;

    console.log('🗺️ Adding property layers...', properties.length);

    try {
      // Separate properties into polygons and points
      const polygonProperties = properties.filter(property => 
        property.geometry && property.geometry.type === 'Polygon'
      );
      const pointProperties = properties.filter(property => 
        !property.geometry || property.geometry.type !== 'Polygon'
      );

      // Add polygon layers (for Travis County parcels)
      if (polygonProperties.length > 0) {
        // Check if source already exists
        if (map.current.getSource('properties-polygons')) {
          console.log('  ⚠️ Properties polygons source already exists, skipping');
        } else {
          const polygonGeojson: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: polygonProperties.map(property => ({
              type: 'Feature' as const,
              geometry: property.geometry as GeoJSON.Polygon,
              properties: {
                id: property.id,
                address: property.address,
                propertyType: property.propertyType,
                marketValue: property.marketValue,
                owner: property.owner,
                city: property.city,
                state: property.state,
                zipCode: property.zipCode
              }
            }))
          };

          // Add polygon source
          map.current.addSource('properties-polygons', {
            type: 'geojson',
            data: polygonGeojson
          });

          // Add parcel fill layer
          map.current.addLayer({
            id: 'properties-polygons',
            type: 'fill',
            source: 'properties-polygons',
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
              'fill-outline-color': [
                'match',
                ['get', 'propertyType'],
                'residential', '#3b82f6',
                'commercial', '#10b981',
                'industrial', '#f59e0b',
                'agricultural', '#8b5cf6',
                'vacant', '#6b7280',
                '#3b82f6'
              ],
              'fill-opacity': 0.6
            }
          });
          
          // Add parcel boundaries
          map.current.addLayer({
            id: 'parcel-boundaries',
            type: 'line',
            source: 'properties-polygons',
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

          // Add hover effects and click handlers
          addHoverEffects('properties-polygons');
          addHoverEffects('parcel-boundaries');
          addClickHandlers('properties-polygons');
          addClickHandlers('parcel-boundaries');
        }
      }

      // Add point layers (for submitted properties)
      if (pointProperties.length > 0) {
        // Check if source already exists
        if (map.current.getSource('properties-points')) {
          console.log('  ⚠️ Properties points source already exists, skipping');
        } else {
          const pointGeojson: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: pointProperties.map(property => ({
              type: 'Feature' as const,
              geometry: {
                type: 'Point' as const,
                coordinates: [property.coordinates.lng, property.coordinates.lat]
              },
              properties: {
                id: property.id,
                address: property.address,
                propertyType: property.propertyType,
                marketValue: property.marketValue,
                owner: property.owner,
                city: property.city,
                state: property.state,
                zipCode: property.zipCode
              }
            }))
          };

          // Add point source
          map.current.addSource('properties-points', {
            type: 'geojson',
            data: pointGeojson
          });

          // Add point symbols
          map.current.addLayer({
            id: 'submitted-properties',
            type: 'circle',
            source: 'properties-points',
            paint: {
              'circle-radius': 8,
              'circle-color': [
                'match',
                ['get', 'propertyType'],
                'residential', '#ef4444',
                'commercial', '#10b981',
                'industrial', '#f59e0b',
                'agricultural', '#8b5cf6',
                'vacant', '#6b7280',
                '#ef4444'
              ],
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2,
              'circle-opacity': 0.8
            }
          });

          // Add hover effects and click handlers
          addHoverEffects('submitted-properties');
          addClickHandlers('submitted-properties');
        }
      }

      console.log('✅ Property layers added successfully');
    } catch (error) {
      console.error('❌ Error adding property layers:', error);
    }
  };

  const addGeoJSONPointsLayer = () => {
    if (!map.current) return;

    console.log('Adding GeoJSON Points layer with popups');

    // Create GeoJSON points from all available data sources
    const allPoints: any[] = [];

    // Add submitted properties as points
    if (properties.length > 0) {
      properties.forEach(property => {
        if (property.coordinates) {
          allPoints.push({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [property.coordinates.lng, property.coordinates.lat]
            },
            properties: {
              id: property.id,
              address: property.address,
              propertyType: property.propertyType,
              marketValue: property.marketValue,
              owner: property.owner,
              city: property.city,
              state: property.state,
              zipCode: property.zipCode,
              source: 'submitted'
            }
          });
        }
      });
    }

    // Add address points if no other data
    if (allPoints.length === 0 && comprehensiveData?.addresses) {
      console.log('No submitted properties, using address points for demo');
      comprehensiveData.addresses.slice(0, 50).forEach(addr => { // Limit to 50 for performance
        allPoints.push({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [addr.coordinates.lng, addr.coordinates.lat]
          },
          properties: {
            id: addr.id,
            address: addr.address,
            city: addr.city,
            state: addr.state,
            zip: addr.zip,
            source: 'address'
          }
        });
      });
    }

    // Add demo points if still no data
    if (allPoints.length === 0) {
      console.log('No data available, adding demo points');
      const demoPoints = [
        { lat: 30.2672, lng: -97.7431, address: 'Downtown Austin', type: 'residential' },
        { lat: 30.2700, lng: -97.7400, address: 'East Austin', type: 'commercial' },
        { lat: 30.2650, lng: -97.7450, address: 'South Austin', type: 'industrial' },
        { lat: 30.2720, lng: -97.7380, address: 'North Austin', type: 'residential' },
        { lat: 30.2600, lng: -97.7500, address: 'West Austin', type: 'commercial' }
      ];
      
      demoPoints.forEach((point, index) => {
        allPoints.push({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [point.lng, point.lat]
          },
          properties: {
            id: `demo-${index}`,
            address: point.address,
            propertyType: point.type,
            marketValue: Math.floor(Math.random() * 500000) + 200000,
            source: 'demo'
          }
        });
      });
    }

    console.log(`Creating GeoJSON layer with ${allPoints.length} points`);

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: allPoints
    };

    // Add GeoJSON source
    map.current.addSource('geojson-points', {
      type: 'geojson',
      data: geojson
    });

    // Add GeoJSON points layer
    map.current.addLayer({
      id: 'geojson-points',
      type: 'circle',
      source: 'geojson-points',
      paint: {
        'circle-radius': 8,
        'circle-color': [
          'match',
          ['get', 'source'],
          'submitted', '#ef4444',
          'enriched', '#3b82f6',
          'address', '#10b981',
          'demo', '#8b5cf6',
          '#6b7280'
        ],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-opacity': 0.8
      }
    });

    // Add hover effects and click handlers
    addHoverEffects('geojson-points');
    addClickHandlers('geojson-points');

    console.log(`✅ GeoJSON Points layer added with ${allPoints.length} points`);
  };

  const addClusteredMarkersLayer = () => {
    if (!map.current) return;

    console.log('Adding Clustered Markers layer');

    // Create GeoJSON points from all available data sources
    const allPoints: any[] = [];

    // Add submitted properties as points
    if (properties.length > 0) {
      properties.forEach(property => {
        if (property.coordinates) {
          allPoints.push({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [property.coordinates.lng, property.coordinates.lat]
            },
            properties: {
              id: property.id,
              address: property.address,
              propertyType: property.propertyType,
              marketValue: property.marketValue,
              owner: property.owner,
              city: property.city,
              state: property.state,
              zipCode: property.zipCode,
              source: 'submitted'
            }
          });
        }
      });
    }

    // Add address points if no other data
    if (allPoints.length === 0 && comprehensiveData?.addresses) {
      console.log('No submitted properties, using address points for clustering demo');
      comprehensiveData.addresses.slice(0, 100).forEach(addr => { // Limit to 100 for clustering demo
        allPoints.push({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [addr.coordinates.lng, addr.coordinates.lat]
          },
          properties: {
            id: addr.id,
            address: addr.address,
            city: addr.city,
            state: addr.state,
            zip: addr.zip,
            source: 'address'
          }
        });
      });
    }

    // Add demo points if still no data
    if (allPoints.length === 0) {
      console.log('No data available, adding demo points for clustering');
      const demoPoints = [
        { lat: 30.2672, lng: -97.7431, address: 'Downtown Austin', type: 'residential' },
        { lat: 30.2700, lng: -97.7400, address: 'East Austin', type: 'commercial' },
        { lat: 30.2650, lng: -97.7450, address: 'South Austin', type: 'industrial' },
        { lat: 30.2720, lng: -97.7380, address: 'North Austin', type: 'residential' },
        { lat: 30.2600, lng: -97.7500, address: 'West Austin', type: 'commercial' },
        { lat: 30.2680, lng: -97.7420, address: 'Central Austin', type: 'residential' },
        { lat: 30.2690, lng: -97.7410, address: 'Midtown Austin', type: 'commercial' },
        { lat: 30.2660, lng: -97.7440, address: 'South Central', type: 'residential' },
        { lat: 30.2710, lng: -97.7390, address: 'North Central', type: 'commercial' },
        { lat: 30.2640, lng: -97.7460, address: 'Southwest Austin', type: 'industrial' }
      ];
      
      demoPoints.forEach((point, index) => {
        allPoints.push({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [point.lng, point.lat]
          },
          properties: {
            id: `demo-cluster-${index}`,
            address: point.address,
            propertyType: point.type,
            marketValue: Math.floor(Math.random() * 500000) + 200000,
            source: 'demo'
          }
        });
      });
    }

    console.log(`Creating clustered layer with ${allPoints.length} points`);

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: allPoints
    };

    // Add clustered source
    map.current.addSource('clusters', {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    // Add cluster circles
    map.current.addLayer({
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

    // Add cluster count labels
    map.current.addLayer({
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

    // Add unclustered point circles
    map.current.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'clusters',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'match',
          ['get', 'source'],
          'submitted', '#ef4444',
          'enriched', '#3b82f6',
          'address', '#10b981',
          'demo', '#8b5cf6',
          '#6b7280'
        ],
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    });

    // Add hover effects and click handlers
    addHoverEffects('unclustered-point');
    addClickHandlers('unclustered-point');

    // Handle cluster clicks
    map.current.on('click', 'clusters', (e) => {
      const features = map.current!.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });
      const clusterId = features[0].properties!.cluster_id;
      (map.current!.getSource('clusters') as any).getClusterExpansionZoom(
        clusterId,
        (err: any, zoom: number) => {
          if (err) return;

          map.current!.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom
          });
        }
      );
    });

    // Change cursor on cluster hover
    map.current.on('mouseenter', 'clusters', () => {
      map.current!.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'clusters', () => {
      map.current!.getCanvas().style.cursor = '';
    });

    console.log(`✅ Clustered Markers layer added with ${allPoints.length} points`);
  };

  const addHeatmapLayer = () => {
    if (!map.current) return;

    console.log('Adding Heatmap layer');

    // Create GeoJSON points from all available data sources
    const allPoints: any[] = [];

    // Add submitted properties as points
    if (properties.length > 0) {
      properties.forEach(property => {
        if (property.coordinates) {
          allPoints.push({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [property.coordinates.lng, property.coordinates.lat]
            },
            properties: {
              id: property.id,
              address: property.address,
              propertyType: property.propertyType,
              marketValue: property.marketValue,
              owner: property.owner,
              city: property.city,
              state: property.state,
              zipCode: property.zipCode,
              source: 'submitted'
            }
          });
        }
      });
    }

    // Add address points if no other data
    if (allPoints.length === 0 && comprehensiveData?.addresses) {
      console.log('No submitted properties, using address points for heatmap demo');
      comprehensiveData.addresses.slice(0, 200).forEach(addr => { // Limit to 200 for heatmap demo
        allPoints.push({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [addr.coordinates.lng, addr.coordinates.lat]
          },
          properties: {
            id: addr.id,
            address: addr.address,
            city: addr.city,
            state: addr.state,
            zip: addr.zip,
            source: 'address'
          }
        });
      });
    }

    // Add demo points if still no data
    if (allPoints.length === 0) {
      console.log('No data available, adding demo points for heatmap');
      const demoPoints = [
        { lat: 30.2672, lng: -97.7431, address: 'Downtown Austin', type: 'residential' },
        { lat: 30.2700, lng: -97.7400, address: 'East Austin', type: 'commercial' },
        { lat: 30.2650, lng: -97.7450, address: 'South Austin', type: 'industrial' },
        { lat: 30.2720, lng: -97.7380, address: 'North Austin', type: 'residential' },
        { lat: 30.2600, lng: -97.7500, address: 'West Austin', type: 'commercial' },
        { lat: 30.2680, lng: -97.7420, address: 'Central Austin', type: 'residential' },
        { lat: 30.2690, lng: -97.7410, address: 'Midtown Austin', type: 'commercial' },
        { lat: 30.2660, lng: -97.7440, address: 'South Central', type: 'residential' },
        { lat: 30.2710, lng: -97.7390, address: 'North Central', type: 'commercial' },
        { lat: 30.2640, lng: -97.7460, address: 'Southwest Austin', type: 'industrial' },
        { lat: 30.2675, lng: -97.7425, address: 'Downtown East', type: 'residential' },
        { lat: 30.2695, lng: -97.7405, address: 'East Central', type: 'commercial' },
        { lat: 30.2655, lng: -97.7445, address: 'South Central East', type: 'residential' },
        { lat: 30.2715, lng: -97.7385, address: 'North Central East', type: 'commercial' },
        { lat: 30.2645, lng: -97.7465, address: 'Southwest Central', type: 'industrial' }
      ];
      
      demoPoints.forEach((point, index) => {
        allPoints.push({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [point.lng, point.lat]
          },
          properties: {
            id: `demo-heatmap-${index}`,
            address: point.address,
            propertyType: point.type,
            marketValue: Math.floor(Math.random() * 500000) + 200000,
            source: 'demo'
          }
        });
      });
    }

    console.log(`Creating heatmap layer with ${allPoints.length} points`);

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: allPoints
    };

    // Add heatmap source
    map.current.addSource('heatmap', {
      type: 'geojson',
      data: geojson
    });

    // Add heatmap layer
    map.current.addLayer({
      id: 'heatmap',
      type: 'heatmap',
      source: 'heatmap',
      paint: {
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'marketValue'],
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
          0, 'rgba(0, 0, 255, 0)',
          0.2, 'rgb(0, 0, 255)',
          0.4, 'rgb(0, 255, 0)',
          0.6, 'rgb(255, 255, 0)',
          0.8, 'rgb(255, 0, 0)',
          1, 'rgb(255, 0, 255)'
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

    // Add heatmap points layer for interaction
    map.current.addLayer({
      id: 'heatmap-points',
      type: 'circle',
      source: 'heatmap',
      paint: {
        'circle-radius': 0,
        'circle-opacity': 0
      }
    });

    // Add hover effects and click handlers
    addHoverEffects('heatmap-points');
    addClickHandlers('heatmap-points');

    console.log(`✅ Heatmap layer added with ${allPoints.length} points`);
  };

  const addBuildingFootprints = (buildings: BuildingFootprint[]) => {
    if (!map.current) return;

    console.log('🗺️ Adding building footprints...', buildings.length);

    try {
      // Check if source already exists
      if (map.current.getSource('buildings')) {
        console.log('  ⚠️ Buildings source already exists, skipping');
        return;
      }

      const buildingGeojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: buildings.map(building => ({
          type: 'Feature' as const,
          geometry: building.geometry,
          properties: {
            id: building.id,
            height: building.height,
            confidence: building.confidence,
            area: building.area,
            building: building.properties.building,
            amenity: building.properties.amenity,
            shop: building.properties.shop,
            office: building.properties.office,
            residential: building.properties.residential,
            isBuilding: true
          }
        }))
      };

      map.current.addSource('buildings', {
        type: 'geojson',
        data: buildingGeojson
      });

      // Add building fill layer with enhanced styling
      map.current.addLayer({
        id: 'buildings-fill',
        type: 'fill',
        source: 'buildings',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'residential'], 'yes'], '#3b82f6', // Blue for residential
            ['==', ['get', 'shop'], 'yes'], '#10b981',        // Green for shops
            ['==', ['get', 'office'], 'yes'], '#f59e0b',      // Orange for offices
            ['==', ['get', 'amenity'], 'yes'], '#8b5cf6',     // Purple for amenities
            '#6b7280'                                          // Gray for unknown
          ],
          'fill-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 0.3,  // More transparent at low zoom
            16, 0.7   // More opaque at high zoom
          ],
          'fill-outline-color': [
            'case',
            ['==', ['get', 'residential'], 'yes'], '#1e40af',
            ['==', ['get', 'shop'], 'yes'], '#065f46',
            ['==', ['get', 'office'], 'yes'], '#d97706',
            ['==', ['get', 'amenity'], 'yes'], '#5b21b6',
            '#374151'
          ]
        }
      });

      // Add building boundaries with dynamic styling
      map.current.addLayer({
        id: 'buildings-boundaries',
        type: 'line',
        source: 'buildings',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'residential'], 'yes'], '#1e40af',
            ['==', ['get', 'shop'], 'yes'], '#065f46',
            ['==', ['get', 'office'], 'yes'], '#d97706',
            ['==', ['get', 'amenity'], 'yes'], '#5b21b6',
            '#374151'
          ],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 0.5,  // Thinner at low zoom
            16, 2     // Thicker at high zoom
          ],
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 0.4,
            16, 0.9
          ]
        }
      });

      // Add building height visualization (3D effect)
      map.current.addLayer({
        id: 'buildings-height',
        type: 'fill-extrusion',
        source: 'buildings',
        paint: {
          'fill-extrusion-color': [
            'case',
            ['==', ['get', 'residential'], 'yes'], '#3b82f6',
            ['==', ['get', 'shop'], 'yes'], '#10b981',
            ['==', ['get', 'office'], 'yes'], '#f59e0b',
            ['==', ['get', 'amenity'], 'yes'], '#8b5cf6',
            '#6b7280'
          ],
          'fill-extrusion-height': [
            'case',
            ['>', ['get', 'height'], 0],
            ['get', 'height'],
            3  // Default height for unknown buildings
          ],
          'fill-extrusion-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 0.1,  // Very transparent at low zoom
            16, 0.6   // More visible at high zoom
          ],
          'fill-extrusion-base': 0
        }
      });

      // Add building labels for important buildings
      map.current.addLayer({
        id: 'buildings-labels',
        type: 'symbol',
        source: 'buildings',
        layout: {
          'text-field': [
            'case',
            ['==', ['get', 'amenity'], 'yes'], ['get', 'amenity'],
            ['==', ['get', 'shop'], 'yes'], ['get', 'shop'],
            ['==', ['get', 'office'], 'yes'], ['get', 'office'],
            ''
          ],
          'text-font': ['Open Sans Regular'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14, 8,   // Smaller at low zoom
            16, 12   // Larger at high zoom
          ],
          'text-offset': [0, 0],
          'text-anchor': 'center',
          'text-allow-overlap': false,
          'text-ignore-placement': false
        },
        paint: {
          'text-color': '#1f2937',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1,
          'text-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14, 0,   // Hidden at low zoom
            16, 0.8  // Visible at high zoom
          ]
        }
      });

      // Enhanced hover effects
      map.current.on('mouseenter', 'buildings-fill', (e) => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
        
        if (e.features && e.features[0] && popup.current) {
          const feature = e.features[0];
          const properties = feature.properties;
          
          // Calculate center point for popup
          const coordinates = (feature.geometry as any).coordinates[0][0].slice();
          
          // Enhanced popup content
          const buildingType = properties?.residential === 'yes' ? 'Residential' :
                              properties?.shop === 'yes' ? 'Commercial' :
                              properties?.office === 'yes' ? 'Office' :
                              properties?.amenity === 'yes' ? 'Amenity' : 'Building';
          
          const height = properties?.height && properties.height > 0 ? `${properties.height}m` : 'Unknown';
          const area = properties?.area ? `${Math.round(properties.area)}m²` : 'Unknown';
          
          const description = `
            <div class="p-4 max-w-xs bg-white rounded-lg shadow-lg border border-gray-200">
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-semibold text-gray-900 text-sm">${buildingType}</h3>
                <span class="px-2 py-1 text-xs font-medium rounded-full ${
                  properties?.residential === 'yes' ? 'bg-blue-100 text-blue-800' :
                  properties?.shop === 'yes' ? 'bg-green-100 text-green-800' :
                  properties?.office === 'yes' ? 'bg-orange-100 text-orange-800' :
                  properties?.amenity === 'yes' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }">${buildingType}</span>
              </div>
              <div class="space-y-1 text-xs text-gray-600">
                <p><span class="font-medium">Height:</span> ${height}</p>
                <p><span class="font-medium">Area:</span> ${area}</p>
                ${properties?.confidence && properties.confidence > 0 ? `<p><span class="font-medium">Confidence:</span> ${Math.round(properties.confidence * 100)}%</p>` : ''}
                <p class="text-blue-600 text-xs mt-2">Click for more details</p>
              </div>
            </div>
          `;
          
          popup.current
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(map.current!);
        }
      });

      map.current.on('mouseleave', 'buildings-fill', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
        if (popup.current) {
          popup.current.remove();
        }
      });

      // Enhanced click handlers
      map.current.on('click', 'buildings-fill', (e) => {
        if (e.features && e.features[0]) {
          const feature = e.features[0];
          console.log('🏢 Building clicked:', feature.properties);
          
          // Add visual feedback
          if (map.current) {
            map.current.getCanvas().style.cursor = 'pointer';
            setTimeout(() => {
              if (map.current) {
                map.current.getCanvas().style.cursor = '';
              }
            }, 200);
          }
          
          // You can add more building-specific actions here
          // For example, show detailed building information
          const buildingInfo = {
            id: feature.properties?.id,
            type: feature.properties?.residential === 'yes' ? 'Residential' :
                  feature.properties?.shop === 'yes' ? 'Commercial' :
                  feature.properties?.office === 'yes' ? 'Office' :
                  feature.properties?.amenity === 'yes' ? 'Amenity' : 'Building',
            height: feature.properties?.height,
            area: feature.properties?.area,
            confidence: feature.properties?.confidence
          };
          
          console.log('🏢 Building details:', buildingInfo);
        }
      });

      console.log('✅ Building footprints added successfully with enhanced styling');
    } catch (error) {
      console.error('❌ Error adding building footprints:', error);
    }
  };

  // Removed addEnrichedProperties function

  const addHoverEffects = (layerId: string) => {
    // Note: Mapbox doesn't support removing specific event listeners easily
    // We'll rely on layer removal to clean up event listeners
    
    map.current!.on('mouseenter', layerId, (e) => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer';
      }
      
      if (e.features && e.features.length > 0 && popup.current) {
        const feature = e.features[0];
        let coordinates;
        
        if (feature.geometry.type === 'Polygon') {
          coordinates = (feature.geometry as any).coordinates[0][0].slice();
        } else {
          coordinates = (feature.geometry as any).coordinates.slice();
        }
        
        // Enhanced popup content
        let description = '';
        
        // Removed enriched properties functionality
        if (onPropertyClick) {
          // Regular property popup
          description = `
            <div class="p-3 max-w-xs">
              <h3 class="font-semibold text-gray-900 text-sm mb-2">${feature.properties?.address || 'Unknown Address'}</h3>
              <div class="space-y-1 text-xs">
                <p class="text-gray-600">Type: ${feature.properties?.propertyType || 'Unknown'}</p>
                <p class="text-gray-600">Value: $${(feature.properties?.marketValue || 0).toLocaleString()}</p>
                ${feature.properties?.owner ? `<p class="text-gray-600">Owner: ${feature.properties.owner}</p>` : ''}
                <p class="text-blue-600 text-xs mt-2">Click for details</p>
              </div>
            </div>
          `;
        }
        
        popup.current
          .setLngLat(coordinates)
          .setHTML(description)
          .addTo(map.current!);
      }
    });

    map.current!.on('mouseleave', layerId, () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
      }
      if (popup.current) {
        popup.current.remove();
      }
    });
  };

  const addClickHandlers = (layerId: string) => {
    // Note: Mapbox doesn't support removing specific event listeners easily
    // We'll rely on layer removal to clean up event listeners
    
    map.current!.on('click', layerId, (e) => {
      // Only handle clicks if we have features and they're not empty
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        
        console.log('🎯 Marker clicked:', feature.properties);
        
        // Check if it's a property (submitted or demo)
        if (onPropertyClick) {
          const propertyId = feature.properties?.id;
          const property = properties.find(p => p.id === propertyId);
          
          if (property) {
            console.log('🏠 Property found, triggering click handler');
            onPropertyClick(property);
            
            // Add visual feedback - briefly highlight the marker
            if (map.current) {
              // Change cursor style temporarily
              map.current.getCanvas().style.cursor = 'pointer';
              setTimeout(() => {
                if (map.current) {
                  map.current.getCanvas().style.cursor = '';
                }
              }, 200);
            }
          } else {
            console.log('⚠️ Property not found for ID:', propertyId);
          }
        }
      }
    });
  };

  // Update layers when properties, comprehensiveData, or layerType changes
  useEffect(() => {
    console.log('🔄 Map useEffect triggered:', {
      hasMap: !!map.current,
      isStyleLoaded: map.current?.isStyleLoaded(),
      layerType,
      propertiesCount: properties.length,
      hasComprehensiveData: !!comprehensiveData
    });
    
    if (map.current && map.current.isStyleLoaded()) {
      console.log('🎯 Map ready, re-adding layers...');
      console.log('Current layer type:', layerType);
      
      // Add a small delay to ensure map is fully ready
      setTimeout(() => {
        if (map.current && map.current.isStyleLoaded()) {
          addAllLayers();
        }
      }, 50);
    } else {
      console.log('⏳ Map not ready yet, waiting...');
    }
  }, [properties, comprehensiveData, layerType]);

  // Handle center and zoom changes
  useEffect(() => {
    if (map.current && center && zoom) {
      map.current.easeTo({
        center: [center.lng, center.lat],
        zoom: zoom,
        duration: 1000 // Smooth animation over 1 second
      });
    }
  }, [center, zoom]);

  // Listen for zoom to property events
  useEffect(() => {
    const handleZoomToProperty = (event: CustomEvent) => {
      console.log('🗺️ Zoom event received:', event.detail);
      
      if (!map.current) {
        console.error('❌ Map not available for zoom');
        return;
      }
      
      if (!event.detail?.coordinates) {
        console.error('❌ No coordinates provided for zoom');
        return;
      }
      
      const { coordinates, property } = event.detail;
      console.log('🗺️ Attempting to zoom to property:', property?.address, 'at coordinates:', coordinates);
      
      // Check if map is ready
      if (!map.current.isStyleLoaded()) {
        console.log('⏳ Map not fully loaded, waiting...');
        // Wait for map to be ready
        const checkMapReady = () => {
          if (map.current && map.current.isStyleLoaded()) {
            console.log('✅ Map is now ready, proceeding with zoom');
            performZoom(coordinates, property);
          } else {
            setTimeout(checkMapReady, 100);
          }
        };
        checkMapReady();
        return;
      }
      
      performZoom(coordinates, property);
    };

    const performZoom = (coordinates: { lat: number; lng: number }, property?: any) => {
      if (!map.current) return;
      
      console.log('🎯 Performing zoom to:', coordinates);
      
      try {
        // More dramatic zoom effect for View on Map button
        map.current.easeTo({
          center: [coordinates.lng, coordinates.lat],
          zoom: 18, // Closer zoom for better detail
          duration: 2000, // Longer animation for dramatic effect
          essential: true // This animation is considered essential with respect to prefers-reduced-motion
        });
        
        console.log('✅ Zoom animation started');
        
        // Add a brief highlight effect to the property marker
        setTimeout(() => {
          if (map.current) {
            // Flash the map briefly to draw attention
            const canvas = map.current.getCanvas();
            canvas.style.filter = 'brightness(1.2)';
            setTimeout(() => {
              if (map.current) {
                map.current.getCanvas().style.filter = '';
              }
            }, 300);
          }
        }, 1000);
      } catch (error) {
        console.error('❌ Error during zoom:', error);
        
        // Fallback: try immediate zoom without animation
        try {
          map.current.setCenter([coordinates.lng, coordinates.lat]);
          map.current.setZoom(18);
          console.log('✅ Fallback zoom completed');
        } catch (fallbackError) {
          console.error('❌ Fallback zoom also failed:', fallbackError);
        }
      }
    };

    // Add event listener
    document.addEventListener('zoomToProperty', handleZoomToProperty as EventListener);

    // Cleanup
    return () => {
      document.removeEventListener('zoomToProperty', handleZoomToProperty as EventListener);
    };
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div
        ref={mapContainer}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '500px' }}
      />
    </div>
  );
}; 