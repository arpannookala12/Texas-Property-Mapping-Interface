import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Property } from '../types';
import type { ComprehensiveData, AddressPoint, CountyBoundary, TexasBoundary } from '../services/comprehensiveDataLoader';
import type { MapLayerType } from './LayerToggle';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapProps {
  properties?: Property[];
  comprehensiveData?: ComprehensiveData;
  enrichedProperties?: any[]; // Add enriched properties
  onPropertyClick?: (property: Property) => void;
  onEnrichedPropertyClick?: (property: any) => void; // Add handler for enriched properties
  className?: string;
  layerType?: MapLayerType;
  center?: { lat: number; lng: number };
  zoom?: number;
}

export const Map: React.FC<MapProps> = ({
  properties = [],
  comprehensiveData,
  enrichedProperties = [],
  onPropertyClick,
  onEnrichedPropertyClick,
  className = '',
  layerType = 'all',
  center,
  zoom
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);


  console.log('Map component rendering with', properties.length, 'properties, layer:', layerType);
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
      // Remove existing layers
      const layersToRemove = [
        'properties', 'properties-polygons', 'parcel-boundaries', 'submitted-properties', 'submitted-properties-symbols',
        'clusters', 'cluster-count', 'unclustered-point', 'heatmap', 'heatmap-points',
        'addresses', 'county-boundaries', 'texas-boundary',
        'enriched-properties', 'enriched-properties-symbols',
        'geojson-points'
      ];
      
      layersToRemove.forEach(layerId => {
        if (map.current!.getLayer(layerId)) {
          map.current!.removeLayer(layerId);
        }
      });

      const sourcesToRemove = [
        'properties', 'properties-polygons', 'properties-points', 'clusters', 'addresses', 'county-boundaries', 'texas-boundary',
        'enriched-properties', 'geojson-points', 'heatmap'
      ];
      
      sourcesToRemove.forEach(sourceId => {
        if (map.current!.getSource(sourceId)) {
          map.current!.removeSource(sourceId);
        }
      });

      // Add background layers for all types
      if (layerType === 'all' || layerType === 'parcels' || layerType === 'points' || layerType === 'clusters' || layerType === 'heatmap') {
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
        case 'all':
          if (properties.length > 0) {
            addPropertyLayers();
          }
          break;
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
      }

      // Add enriched properties as standalone markers (always visible when available)
      if (enrichedProperties.length > 0) {
        console.log('About to add enriched properties, count:', enrichedProperties.length);
        addEnrichedProperties();
      } else {
        console.log('No enriched properties to add');
      }


      // Add building footprints layer
      if (layerType === 'buildings' || layerType === 'all') {
        // Building footprints removed for now
      }

    } catch (error) {
      console.error('Error adding layers:', error);
    }
  };

  const addTravisCountyParcels = () => {
    if (!map.current || !comprehensiveData?.parcels || comprehensiveData.parcels.length === 0) return;

    console.log('Adding Travis County parcels:', comprehensiveData.parcels.length);

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
        'fill-color': 'rgba(59, 130, 246, 0.1)',
        'fill-outline-color': 'rgba(59, 130, 246, 0.3)',
        'fill-opacity': 0.3
      }
    });

    // Add parcel boundaries
    map.current.addLayer({
      id: 'travis-parcels-boundaries',
      type: 'line',
      source: 'travis-parcels',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 1,
        'line-opacity': 0.6
      }
    });

    // Add hover effects and click handlers
    addHoverEffects('travis-parcels-fill');
    addHoverEffects('travis-parcels-boundaries');
    addClickHandlers('travis-parcels-fill');
    addClickHandlers('travis-parcels-boundaries');
  };

  const addTexasBoundary = (texasBoundary: TexasBoundary) => {
    if (!map.current) return;

    map.current.addSource('texas-boundary', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: texasBoundary.geometry,
        properties: {}
      }
    });

    map.current.addLayer({
      id: 'texas-boundary',
      type: 'line',
      source: 'texas-boundary',
      paint: {
        'line-color': '#1f2937',
        'line-width': 2,
        'line-opacity': 0.8
      }
    });

    console.log('✅ Texas boundary added');
  };

  const addCountyBoundaries = (counties: CountyBoundary[]) => {
    if (!map.current) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: counties.map(county => ({
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
        'line-opacity': 0.6
      }
    });

    // Add hover effects for county boundaries
    map.current.on('mouseenter', 'county-boundaries', (e) => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer';
      }
      
      if (e.features && e.features[0] && popup.current) {
        const feature = e.features[0];
        const coordinates = (feature.geometry as any).coordinates[0][0].slice();
        
        const description = `
          <div class="p-2">
            <h3 class="font-semibold text-gray-900">${feature.properties?.name || 'Unknown County'}</h3>
            <p class="text-sm text-gray-600">FIPS: ${feature.properties?.fips || 'N/A'}</p>
          </div>
        `;
        
        popup.current
          .setLngLat(coordinates)
          .setHTML(description)
          .addTo(map.current!);
      }
    });

    map.current.on('mouseleave', 'county-boundaries', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
      }
      if (popup.current) {
        popup.current.remove();
      }
    });

    console.log('✅ County boundaries added');
  };

  const addAddresses = (addresses: AddressPoint[]) => {
    if (!map.current) return;

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

    console.log('✅ Addresses added');
  };

  const addPropertyLayers = () => {
    if (!map.current) return;

    // Separate properties into polygons and points
    const polygonProperties = properties.filter(property => 
      property.geometry && property.geometry.type === 'Polygon'
    );
    const pointProperties = properties.filter(property => 
      !property.geometry || property.geometry.type !== 'Polygon'
    );

    // Add polygon layers (for Travis County parcels)
    if (polygonProperties.length > 0) {
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

      addHoverEffects('properties-polygons');
      addHoverEffects('parcel-boundaries');
      addClickHandlers('properties-polygons');
      addClickHandlers('parcel-boundaries');
    }

    // Add point layers (for submitted properties)
    if (pointProperties.length > 0) {
      console.log('Adding submitted properties as markers:', pointProperties.length);
      console.log('Sample submitted property:', pointProperties[0]);
      
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
            zipCode: property.zipCode,
            isSubmitted: true // Flag to identify submitted properties
          }
        }))
      };

      // Add point source
      map.current.addSource('properties-points', {
        type: 'geojson',
        data: pointGeojson
      });

      // Add submitted property markers
      map.current.addLayer({
        id: 'submitted-properties',
        type: 'circle',
        source: 'properties-points',
        paint: {
          'circle-radius': 12,
          'circle-color': '#ef4444', // Red for submitted properties
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9
        }
      });

      // Add a symbol layer for better visibility
      map.current.addLayer({
        id: 'submitted-properties-symbols',
        type: 'symbol',
        source: 'properties-points',
        layout: {
          'text-field': ['get', 'address'],
          'text-font': ['Open Sans Regular'],
          'text-size': 12,
          'text-offset': [0, 1.8],
          'text-anchor': 'top',
          'icon-image': 'marker-15', // Default Mapbox marker icon
          'icon-size': 1.5,
          'icon-allow-overlap': true
        },
        paint: {
          'text-color': '#1f2937',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1
        }
      });

      addHoverEffects('submitted-properties');
      addHoverEffects('submitted-properties-symbols');
      addClickHandlers('submitted-properties');
      addClickHandlers('submitted-properties-symbols');
    }

    console.log('✅ Property layers added successfully');
    console.log(`  - ${polygonProperties.length} polygon properties (parcels)`);
    console.log(`  - ${pointProperties.length} point properties (submitted)`);
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

    // Add enriched properties as points
    if (enrichedProperties.length > 0) {
      enrichedProperties.forEach(property => {
        allPoints.push({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [property.coordinates.lng, property.coordinates.lat]
          },
          properties: {
            id: property.propertyId,
            address: property.address,
            propertyType: property.propertyType,
            marketValue: property.marketValue,
            appraisedValue: property.appraisedValue,
            squareFootage: property.squareFootage,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            yearBuilt: property.yearBuilt,
            lotSize: property.lotSize,
            lastSaleDate: property.lastSaleDate,
            lastSalePrice: property.lastSalePrice,
            ownerName: property.ownerName,
            source: 'enriched'
          }
        });
      });
    }

    // Add address points if no other data
    if (allPoints.length === 0 && comprehensiveData?.addresses) {
      comprehensiveData.addresses.forEach(addr => {
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

    if (allPoints.length === 0) {
      console.log('No points available for GeoJSON layer');
      return;
    }

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

    // Add enriched properties as points
    if (enrichedProperties.length > 0) {
      enrichedProperties.forEach(property => {
        allPoints.push({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [property.coordinates.lng, property.coordinates.lat]
          },
          properties: {
            id: property.propertyId,
            address: property.address,
            propertyType: property.propertyType,
            marketValue: property.marketValue,
            appraisedValue: property.appraisedValue,
            squareFootage: property.squareFootage,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            yearBuilt: property.yearBuilt,
            lotSize: property.lotSize,
            lastSaleDate: property.lastSaleDate,
            lastSalePrice: property.lastSalePrice,
            ownerName: property.ownerName,
            source: 'enriched'
          }
        });
      });
    }

    // Add address points if no other data
    if (allPoints.length === 0 && comprehensiveData?.addresses) {
      comprehensiveData.addresses.forEach(addr => {
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

    if (allPoints.length === 0) {
      console.log('No points available for clustering');
      return;
    }

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

    // Add unclustered point markers
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
          '#6b7280'
        ],
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Add click handlers for clusters
    map.current.on('click', 'clusters', (e) => {
      const features = map.current!.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });
      const clusterId = features[0].properties!.cluster_id;
      const source = map.current!.getSource('clusters') as any;
      source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
        if (err) return;

        map.current!.easeTo({
          center: (features[0].geometry as any).coordinates,
          zoom: zoom
        });
      });
    });

    // Add click handlers for unclustered points
    map.current.on('click', 'unclustered-point', (e) => {
      if (e.features && e.features[0]) {
        const feature = e.features[0];
        
        // Check if it's an enriched property
        if (feature.properties?.source === 'enriched' && onEnrichedPropertyClick) {
          const enrichedProperty = enrichedProperties.find(p => p.propertyId === feature.properties?.id);
          if (enrichedProperty) {
            onEnrichedPropertyClick(enrichedProperty);
          }
        } else if (onPropertyClick) {
          // Handle regular properties
          const property = properties.find(p => p.id === feature.properties?.id);
          if (property) {
            onPropertyClick(property);
          }
        }
      }
    });

    // Add hover effects
    map.current.on('mouseenter', 'clusters', () => {
      map.current!.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'clusters', () => {
      map.current!.getCanvas().style.cursor = '';
    });

    map.current.on('mouseenter', 'unclustered-point', () => {
      map.current!.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'unclustered-point', () => {
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
              source: 'submitted',
              // Heatmap intensity based on market value
              heat: Math.min(property.marketValue / 1000000, 1) // Normalize to 0-1
            }
          });
        }
      });
    }

    // Add enriched properties as points
    if (enrichedProperties.length > 0) {
      enrichedProperties.forEach(property => {
        allPoints.push({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [property.coordinates.lng, property.coordinates.lat]
          },
          properties: {
            id: property.propertyId,
            address: property.address,
            propertyType: property.propertyType,
            marketValue: property.marketValue,
            appraisedValue: property.appraisedValue,
            squareFootage: property.squareFootage,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            yearBuilt: property.yearBuilt,
            lotSize: property.lotSize,
            lastSaleDate: property.lastSaleDate,
            lastSalePrice: property.lastSalePrice,
            ownerName: property.ownerName,
            source: 'enriched',
            // Heatmap intensity based on market value
            heat: Math.min(property.marketValue / 1000000, 1) // Normalize to 0-1
          }
        });
      });
    }

    // Add address points if no other data
    if (allPoints.length === 0 && comprehensiveData?.addresses) {
      comprehensiveData.addresses.forEach(addr => {
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
            source: 'address',
            heat: 0.5 // Default heat intensity for addresses
          }
        });
      });
    }

    if (allPoints.length === 0) {
      console.log('No points available for heatmap');
      return;
    }

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
          ['get', 'heat'],
          0, 0,
          1, 1
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

    // Add point markers on top of heatmap for interaction
    map.current.addLayer({
      id: 'heatmap-points',
      type: 'circle',
      source: 'heatmap',
      paint: {
        'circle-radius': 6,
        'circle-color': [
          'match',
          ['get', 'source'],
          'submitted', '#ef4444',
          'enriched', '#3b82f6',
          'address', '#10b981',
          '#6b7280'
        ],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
        'circle-opacity': 0.7
      }
    });

    // Add click handlers for heatmap points
    map.current.on('click', 'heatmap-points', (e) => {
      if (e.features && e.features[0]) {
        const feature = e.features[0];
        
        // Check if it's an enriched property
        if (feature.properties?.source === 'enriched' && onEnrichedPropertyClick) {
          const enrichedProperty = enrichedProperties.find(p => p.propertyId === feature.properties?.id);
          if (enrichedProperty) {
            onEnrichedPropertyClick(enrichedProperty);
          }
        } else if (onPropertyClick) {
          // Handle regular properties
          const property = properties.find(p => p.id === feature.properties?.id);
          if (property) {
            onPropertyClick(property);
          }
        }
      }
    });

    // Add hover effects
    map.current.on('mouseenter', 'heatmap-points', () => {
      map.current!.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'heatmap-points', () => {
      map.current!.getCanvas().style.cursor = '';
    });

    console.log(`✅ Heatmap layer added with ${allPoints.length} points`);
  };

  const addEnrichedProperties = () => {
    if (!map.current || enrichedProperties.length === 0) {
      console.log('Cannot add enriched properties:', { 
        mapExists: !!map.current, 
        enrichedCount: enrichedProperties.length 
      });
      return;
    }

    console.log('Adding enriched properties as markers:', enrichedProperties.length);
    console.log('Sample enriched property:', enrichedProperties[0]);

    // Create GeoJSON for enriched properties
    const enrichedGeojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: enrichedProperties.map(property => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [property.coordinates.lng, property.coordinates.lat]
        },
        properties: {
          id: property.propertyId,
          address: property.address,
          marketValue: property.marketValue,
          appraisedValue: property.appraisedValue,
          propertyType: property.propertyType,
          squareFootage: property.squareFootage,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          yearBuilt: property.yearBuilt,
          lotSize: property.lotSize,
          lastSaleDate: property.lastSaleDate,
          lastSalePrice: property.lastSalePrice,
          ownerName: property.ownerName,
          isEnriched: true
        }
      }))
    };

    console.log('Enriched GeoJSON created:', enrichedGeojson.features.length, 'features');
    console.log('Sample feature:', enrichedGeojson.features[0]);

    try {
      // Add enriched properties source
      map.current.addSource('enriched-properties', {
        type: 'geojson',
        data: enrichedGeojson
      });

      console.log('✅ Enriched properties source added');

      // Add enriched properties as circle markers
      map.current.addLayer({
        id: 'enriched-properties',
        type: 'circle',
        source: 'enriched-properties',
        paint: {
          'circle-radius': 12,
          'circle-color': [
            'match',
            ['get', 'propertyType'],
            'residential', '#3b82f6',
            'commercial', '#10b981',
            'industrial', '#f59e0b',
            'agricultural', '#8b5cf6',
            'vacant', '#6b7280',
            '#3b82f6'
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 3,
          'circle-opacity': 0.9
        }
      });

      console.log('✅ Enriched properties circle layer added');

      // Add enriched properties symbols for better visibility
      map.current.addLayer({
        id: 'enriched-properties-symbols',
        type: 'symbol',
        source: 'enriched-properties',
        layout: {
          'text-field': ['get', 'address'],
          'text-font': ['Open Sans Regular'],
          'text-size': 11,
          'text-offset': [0, 1.8],
          'text-anchor': 'top',
          'icon-image': 'marker-15',
          'icon-size': 1.5,
          'icon-allow-overlap': true
        },
        paint: {
          'text-color': '#1f2937',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1
        }
      });

      console.log('✅ Enriched properties symbol layer added');

      // Add hover effects for enriched properties
      addHoverEffects('enriched-properties');
      addHoverEffects('enriched-properties-symbols');
      addClickHandlers('enriched-properties');
      addClickHandlers('enriched-properties-symbols');

      console.log('✅ Enriched properties event handlers added');
    } catch (error) {
      console.error('Error adding enriched properties:', error);
    }
  };

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
        
        if (feature.properties?.isEnriched || feature.properties?.source === 'enriched') {
          // Enriched property popup
          description = `
            <div class="p-3 max-w-xs">
              <h3 class="font-semibold text-gray-900 text-sm mb-2">${feature.properties?.address || 'Unknown Address'}</h3>
              <div class="space-y-1 text-xs">
                <p class="text-green-600 font-medium">$${(feature.properties?.marketValue || 0).toLocaleString()} market value</p>
                <p class="text-gray-600">Type: ${feature.properties?.propertyType || 'Unknown'}</p>
                ${feature.properties?.squareFootage ? `<p class="text-gray-600">${feature.properties.squareFootage.toLocaleString()} sq ft</p>` : ''}
                ${feature.properties?.bedrooms ? `<p class="text-gray-600">${feature.properties.bedrooms} beds, ${feature.properties.bathrooms || 0} baths</p>` : ''}
                ${feature.properties?.yearBuilt ? `<p class="text-gray-600">Built ${feature.properties.yearBuilt}</p>` : ''}
                ${feature.properties?.ownerName ? `<p class="text-gray-600">Owner: ${feature.properties.ownerName}</p>` : ''}
                <p class="text-blue-600 text-xs mt-2">Click for details</p>
              </div>
            </div>
          `;
        } else {
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
        
        // Check if it's an enriched property
        if (feature.properties?.isEnriched && onEnrichedPropertyClick) {
          // Find the enriched property and call the handler
          const enrichedProperty = enrichedProperties.find(p => p.propertyId === feature.properties?.id);
          if (enrichedProperty) {
            onEnrichedPropertyClick(enrichedProperty);
          }
        } else if (feature.properties?.source === 'enriched' && onEnrichedPropertyClick) {
          // Handle enriched properties from new layer types
          const enrichedProperty = enrichedProperties.find(p => p.propertyId === feature.properties?.id);
          if (enrichedProperty) {
            onEnrichedPropertyClick(enrichedProperty);
          }
        } else if (onPropertyClick) {
          // Handle regular properties
          const propertyId = feature.properties?.id;
          const property = properties.find(p => p.id === propertyId);
          if (property) {
            onPropertyClick(property);
          }
        }
      }
    });
  };

  // Update layers when properties, comprehensiveData, or layerType changes
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      addAllLayers();
    }
  }, [properties, comprehensiveData, layerType, enrichedProperties]);

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