import { useState, useEffect } from 'react';
import { Map } from './components/Map';
import { LayerToggle } from './components/LayerToggle';
import { FloatingPropertyForm } from './components/FloatingPropertyForm';
import { PropertyCard } from './components/PropertyCard';
import { PropertySearchFilters } from './components/SearchFilters';
import type { Property } from './types';
import type { PropertySubmission } from './components/FloatingPropertyForm';
import type { ComprehensiveData } from './services/comprehensiveDataLoader';
import type { MapLayerType } from './components/LayerToggle';
import { loadComprehensiveData } from './services/comprehensiveDataLoader';
import { addProperty, loadProperties, deleteProperty } from './services/propertyStorage';

function App() {
  const [currentLayer, setCurrentLayer] = useState<MapLayerType>('all');
  const [submittedProperties, setSubmittedProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [comprehensiveData, setComprehensiveData] = useState<ComprehensiveData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null); // Add map reference

  // Filter state (expanded)
  const [filters, setFilters] = useState({
    address: '', propertyType: '', minPrice: 0, maxPrice: 0,
    city: '', state: '', minYearBuilt: 0, maxYearBuilt: 0,
    minSquareFootage: 0, maxSquareFootage: 0, bedrooms: 0, bathrooms: 0
  });

  // Map viewport state
  const [mapCenter, setMapCenter] = useState({ lat: 30.2672, lng: -97.7431 });
  const [mapZoom, setMapZoom] = useState(10);

  // Filter submitted properties
  const filteredProperties = submittedProperties.filter(property => {
    console.log('Filtering property:', property.address, 'with filters:', filters);
    
    if (filters.address && !property.address.toLowerCase().includes(filters.address.toLowerCase())) {
      console.log('Filtered out by address:', property.address);
      return false;
    }
    if (filters.propertyType && property.propertyType !== filters.propertyType) {
      console.log('Filtered out by property type:', property.propertyType);
      return false;
    }
    if (filters.minPrice && property.marketValue < filters.minPrice) {
      console.log('Filtered out by min price:', property.marketValue, '<', filters.minPrice);
      return false;
    }
    if (filters.maxPrice && property.marketValue > filters.maxPrice) {
      console.log('Filtered out by max price:', property.marketValue, '>', filters.maxPrice);
      return false;
    }
    if (filters.minYearBuilt && property.yearBuilt && property.yearBuilt < filters.minYearBuilt) {
      console.log('Filtered out by min year built:', property.yearBuilt, '<', filters.minYearBuilt);
      return false;
    }
    if (filters.maxYearBuilt && property.yearBuilt && property.yearBuilt > filters.maxYearBuilt) {
      console.log('Filtered out by max year built:', property.yearBuilt, '>', filters.maxYearBuilt);
      return false;
    }
    if (filters.minSquareFootage && property.squareFootage && property.squareFootage < filters.minSquareFootage) {
      console.log('Filtered out by min square footage:', property.squareFootage, '<', filters.minSquareFootage);
      return false;
    }
    if (filters.maxSquareFootage && property.squareFootage && property.squareFootage > filters.maxSquareFootage) {
      console.log('Filtered out by max square footage:', property.squareFootage, '>', filters.maxSquareFootage);
      return false;
    }
    if (filters.bedrooms && property.bedrooms && property.bedrooms < filters.bedrooms) {
      console.log('Filtered out by bedrooms:', property.bedrooms, '<', filters.bedrooms);
      return false;
    }
    if (filters.bathrooms && property.bathrooms && property.bathrooms < filters.bathrooms) {
      console.log('Filtered out by bathrooms:', property.bathrooms, '<', filters.bathrooms);
      return false;
    }
    
    console.log('Property passed all filters:', property.address);
    return true;
  });

  // Debug logging
  useEffect(() => {
    console.log('Submitted properties:', submittedProperties.length);
    console.log('Filtered properties:', filteredProperties.length);
    console.log('Current filters:', filters);
  }, [submittedProperties, filteredProperties, filters]);

  // Load comprehensive data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔄 Loading comprehensive data...');
        const data = await loadComprehensiveData();
        console.log('✅ Comprehensive data loaded:', {
          parcels: data.parcels.length,
          addresses: data.addresses.length,
          counties: data.counties.length,
          buildings: data.buildings?.length || 0,
          hasTexasBoundary: !!data.texasBoundary
        });
        
        setComprehensiveData(data);
        
        // Load submitted properties
        const submitted = loadProperties();
        console.log('📋 Loaded submitted properties:', submitted.length);
        setSubmittedProperties(submitted);
        
        console.log('✅ All data loaded successfully');
      } catch (err) {
        console.error('❌ Error loading data:', err);
        setError('Failed to load data. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle property submission
  const handlePropertySubmission = async (submission: PropertySubmission) => {
    try {
      const newProperty = await addProperty(submission);
      setSubmittedProperties(prev => [...prev, newProperty]);
      setShowSubmissionForm(false);
      
      // Center map on new property
      setMapCenter({
        lat: submission.coordinates.lat,
        lng: submission.coordinates.lng
      });
      setMapZoom(16);
      
      console.log('✅ Property submitted successfully');
    } catch (error) {
      console.error('Error submitting property:', error);
      alert('Failed to submit property. Please try again.');
    }
  };

  // Handle property click from map or card
  const handlePropertyClick = (property: Property) => {
    console.log('🏠 Property clicked:', property.address);
    setSelectedProperty(property);
    
    // Zoom to the property location
    if (property.coordinates) {
      const mapElement = document.querySelector('.mapboxgl-map');
      if (mapElement) {
        // Trigger a custom event to zoom the map
        const zoomEvent = new CustomEvent('zoomToProperty', {
          detail: {
            coordinates: property.coordinates,
            property: property
          }
        });
        mapElement.dispatchEvent(zoomEvent);
      }
    }
  };

  // Handle property card selection
  const handlePropertyCardSelect = (property: Property) => {
    console.log('📋 Property card selected:', property.address);
    setSelectedProperty(property);
    
    // Zoom to the property location
    if (property.coordinates) {
      const mapElement = document.querySelector('.mapboxgl-map');
      if (mapElement) {
        // Trigger a custom event to zoom the map
        const zoomEvent = new CustomEvent('zoomToProperty', {
          detail: {
            coordinates: property.coordinates,
            property: property
          }
        });
        mapElement.dispatchEvent(zoomEvent);
      }
    }
  };

  // Handle map ready
  const handleMapReady = (map: mapboxgl.Map) => {
    console.log('🗺️ Map is ready for use');
    setMapInstance(map);
  };

  // Handle View on Map button click
  const handleViewOnMap = (property: Property) => {
    console.log('🗺️ View on Map clicked for:', property.address);
    console.log('📍 Property coordinates:', property.coordinates);
    
    // Zoom to the property location with a more dramatic zoom
    if (property.coordinates) {
      console.log('🎯 Attempting to zoom to property...');
      
      // Try direct map method first
      if (mapInstance) {
        console.log('✅ Using direct map method for zoom');
        try {
          mapInstance.easeTo({
            center: [property.coordinates.lng, property.coordinates.lat],
            zoom: 18,
            duration: 2000,
            essential: true
          });
          console.log('✅ Direct zoom successful');
          
          // Set as selected property for visual feedback
          setSelectedProperty(property);
          
          // Show notification
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
          notification.textContent = `Zoomed to ${property.address}`;
          document.body.appendChild(notification);
          
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          }, 2000);
          
          return;
        } catch (error) {
          console.error('❌ Direct zoom failed:', error);
        }
      }
      
      // Fallback to event method
      console.log('🔄 Falling back to event method...');
      const mapElement = document.querySelector('.mapboxgl-map');
      console.log('🗺️ Map element found:', !!mapElement);
      
      if (mapElement) {
        const zoomEvent = new CustomEvent('zoomToProperty', {
          detail: {
            coordinates: property.coordinates,
            property: property
          }
        });
        
        console.log('📡 Dispatching zoomToProperty event with data:', zoomEvent.detail);
        mapElement.dispatchEvent(zoomEvent);
        
        setSelectedProperty(property);
        
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = `Zooming to ${property.address}`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 2000);
      } else {
        console.error('❌ Map element not found');
        alert('Map not found. Please refresh the page and try again.');
      }
    } else {
      console.error('❌ Property has no coordinates');
      alert('This property has no location data.');
    }
  };

  // Handle property deletion
  const handleDeleteProperty = (propertyId: string) => {
    try {
      deleteProperty(propertyId);
      setSubmittedProperties(prev => prev.filter(p => p.id !== propertyId));
      setSelectedProperty(null);
      console.log('✅ Property deleted successfully');
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property. Please try again.');
    }
  };

  // Handle layer change
  const handleLayerChange = (layer: MapLayerType) => {
    setCurrentLayer(layer);
  };

  // Handle search
  const handleSearch = () => {
    console.log('🔍 Search triggered with filters:', filters);
    console.log(`📊 Found ${filteredProperties.length} properties matching criteria`);
    
    // Force a re-render of the filtered properties
    setSubmittedProperties(prev => [...prev]);
    
    // Show a notification
    if (filteredProperties.length === 0) {
      alert('No properties found matching your criteria. Try adjusting your filters.');
    } else {
      alert(`Found ${filteredProperties.length} properties matching your criteria.`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Texas Property Mapping Interface
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Texas Property Mapping</h1>
              <p className="text-gray-600">Travis County Real Estate - Interactive Property System</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Layer Toggle */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-3">Map Layers</h2>
              <LayerToggle currentLayer={currentLayer} onLayerChange={handleLayerChange} />
            </div>

            {/* Property Submission */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-3">Add Property</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setShowSubmissionForm(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  + Submit New Property
                </button>
              </div>
            </div>

            {/* Search Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-3">Filter Properties</h2>
              <PropertySearchFilters
                filters={filters}
                onFiltersChange={(newFilters) => setFilters({
                  address: newFilters.address || '',
                  propertyType: newFilters.propertyType || '',
                  minPrice: newFilters.minPrice || 0,
                  maxPrice: newFilters.maxPrice || 0,
                  city: newFilters.city || '',
                  state: newFilters.state || '',
                  minYearBuilt: newFilters.minYearBuilt || 0,
                  maxYearBuilt: newFilters.maxYearBuilt || 0,
                  minSquareFootage: newFilters.minSquareFootage || 0,
                  maxSquareFootage: newFilters.maxSquareFootage || 0,
                  bedrooms: newFilters.bedrooms || 0,
                  bathrooms: newFilters.bathrooms || 0
                })}
                onSearch={handleSearch}
              />
            </div>

            {/* Data Status */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-3">Data Status</h2>
              {isLoading && <p className="text-blue-600">Loading data...</p>}
              {error && <p className="text-red-600">{error}</p>}
              {comprehensiveData && (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Parcels: {comprehensiveData.parcels.length}</p>
                  <p>Addresses: {comprehensiveData.addresses.length}</p>
                  <p>Submitted: {submittedProperties.length}</p>
                </div>
              )}
            </div>

            {/* Submitted Properties List */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Your Properties</h2>
                <span className="text-sm text-gray-500">
                  {filteredProperties.length} of {submittedProperties.length}
                </span>
              </div>
              
              {/* Active filters indicator */}
              {Object.values(filters).some(value => value !== '' && value !== 0) && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                  <span className="font-medium">Active filters:</span>
                  {filters.address && <span className="ml-2">Address: "{filters.address}"</span>}
                  {filters.propertyType && <span className="ml-2">Type: {filters.propertyType}</span>}
                  {filters.minPrice > 0 && <span className="ml-2">Min: ${filters.minPrice.toLocaleString()}</span>}
                  {filters.maxPrice > 0 && <span className="ml-2">Max: ${filters.maxPrice.toLocaleString()}</span>}
                </div>
              )}
              
              {filteredProperties.length === 0 ? (
                <div className="text-center py-8">
                  {submittedProperties.length === 0 ? (
                    <div>
                      <p className="text-gray-500 text-sm mb-2">No properties submitted yet.</p>
                      <button
                        onClick={() => setShowSubmissionForm(true)}
                        className="btn-primary text-sm"
                      >
                        + Submit Your First Property
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-500 text-sm mb-2">No properties match your filters.</p>
                      <button
                        onClick={() => setFilters({
                          address: '',
                          propertyType: '',
                          minPrice: 0,
                          maxPrice: 0,
                          city: '',
                          state: '',
                          minYearBuilt: 0,
                          maxYearBuilt: 0,
                          minSquareFootage: 0,
                          maxSquareFootage: 0,
                          bedrooms: 0,
                          bathrooms: 0
                        })}
                        className="btn-secondary text-sm"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredProperties.map(property => (
                    <div
                      key={property.id}
                      className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                      onClick={() => handlePropertyClick(property)}
                    >
                      <p className="font-medium text-gray-900 text-sm">{property.address}</p>
                      <p className="text-sm text-gray-600">${property.marketValue.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 capitalize">{property.propertyType}</p>
                      <p className="text-xs text-blue-600">Click to view details</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Map and Property Cards Column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Map */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
                <Map
                  layerType={currentLayer}
                  properties={submittedProperties}
                  onPropertyClick={handlePropertyClick}
                  comprehensiveData={comprehensiveData || undefined}
                  onMapReady={handleMapReady}
                />
              </div>
            </div>

            {/* Property Cards Below Map */}
            {filteredProperties.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Property Details</h2>
                  <span className="text-sm text-gray-500">
                    Showing {filteredProperties.length} properties
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProperties.map(property => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onClose={() => setSelectedProperty(null)}
                      onDelete={() => handleDeleteProperty(property.id)}
                      onSelect={() => handlePropertyCardSelect(property)}
                      onViewOnMap={() => handleViewOnMap(property)}
                      isSelected={selectedProperty?.id === property.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Property Submission Form */}
        {showSubmissionForm && (
          <FloatingPropertyForm
            isVisible={showSubmissionForm}
            onSubmit={handlePropertySubmission}
            onClose={() => { setShowSubmissionForm(false); }}
          />
        )}

        {/* Debug info */}
        {selectedProperty && (
          <div className="fixed bottom-4 right-4 bg-blue-100 p-2 rounded text-xs">
            Selected Property: {selectedProperty.address}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
