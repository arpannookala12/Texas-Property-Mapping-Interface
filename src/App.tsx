import { useState, useEffect } from 'react';
import { Map } from './components/Map';
import { PropertySearchFilters } from './components/SearchFilters';
import { FloatingPropertyForm } from './components/FloatingPropertyForm';
import { PropertyCard } from './components/PropertyCard';
import { LayerToggle } from './components/LayerToggle';
import { TestPage } from './components/TestPage';
import { loadComprehensiveData } from './services/comprehensiveDataLoader';
import { propertyEnrichmentService } from './services/propertyDataEnrichment';
import type { PropertySubmission } from './components/FloatingPropertyForm';
import type { MapLayerType } from './components/LayerToggle';
import type { ComprehensiveData } from './services/comprehensiveDataLoader';
import type { Property } from './types';
import type { EnrichedPropertyData } from './services/propertyDataEnrichment';
import { loadProperties, addProperty, deleteProperty } from './services/propertyStorage';

function App() {
  // Core state
  const [properties, setProperties] = useState<Property[]>([]);
  const [submittedProperties, setSubmittedProperties] = useState<Property[]>([]);
  const [comprehensiveData, setComprehensiveData] = useState<ComprehensiveData | null>(null);
  const [enrichedProperties, setEnrichedProperties] = useState<EnrichedPropertyData[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [currentLayer, setCurrentLayer] = useState<MapLayerType>('parcels');
  const [showTestPage, setShowTestPage] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    address: '',
    propertyType: '',
    minPrice: 0,
    maxPrice: 0
  });

  // Map viewport state
  const [mapCenter, setMapCenter] = useState({ lat: 30.2672, lng: -97.7431 });
  const [mapZoom, setMapZoom] = useState(10);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load comprehensive data (parcels, addresses, etc.)
        const data = await loadComprehensiveData();
        setComprehensiveData(data);
        
        // Load submitted properties
        const submitted = loadProperties();
        setSubmittedProperties(submitted);
        
        // Enrich address points with TCAD data
        await enrichAddressPoints(data);
        
        console.log('✅ All data loaded successfully');
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Enrich address points with TCAD data
  const enrichAddressPoints = async (data: ComprehensiveData) => {
    if (!data.addresses || data.addresses.length === 0) return;

    setIsEnriching(true);
    try {
      const addressPoints = data.addresses.map(addr => ({
        address: addr.address || `${addr.city}, ${addr.state} ${addr.zip}`,
        coordinates: {
          lat: addr.coordinates.lat,
          lng: addr.coordinates.lng
        }
      }));

      const enriched = await propertyEnrichmentService.enrichAddressPoints(addressPoints, {
        useTCADData: true,
        usePublicRecords: true,
        maxProperties: 50 // Limit for performance
      });

      setEnrichedProperties(enriched);
      console.log(`✅ Enriched ${enriched.length} properties with TCAD data`);
    } catch (error) {
      console.error('Error enriching properties:', error);
    } finally {
      setIsEnriching(false);
    }
  };

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

  // Handle property click
  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    
    // Center map on clicked property
    if (property.coordinates) {
      setMapCenter({
        lat: property.coordinates.lat,
        lng: property.coordinates.lng
      });
      setMapZoom(16);
    }
  };

  // Handle enriched property click
  const handleEnrichedPropertyClick = (property: EnrichedPropertyData) => {
    // Center map on enriched property
    setMapCenter({
      lat: property.coordinates.lat,
      lng: property.coordinates.lng
    });
    setMapZoom(16);
    
    // Show property info in a simplified way
    alert(`${property.address}\nMarket Value: $${property.marketValue.toLocaleString()}\nType: ${property.propertyType}`);
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

  // Filter submitted properties
  const filteredProperties = submittedProperties.filter(property => {
    if (filters.address && !property.address.toLowerCase().includes(filters.address.toLowerCase())) return false;
    if (filters.propertyType && property.propertyType !== filters.propertyType) return false;
    if (filters.minPrice && property.marketValue < filters.minPrice) return false;
    if (filters.maxPrice && property.marketValue > filters.maxPrice) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Texas Property Mapping</h1>
              <p className="text-gray-600">Travis County Real Estate - Interactive Property System</p>
            </div>
            <button
              onClick={() => setShowTestPage(!showTestPage)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {showTestPage ? '🏠 Main App' : '🧪 Test Page'}
            </button>
          </div>
        </div>

        {showTestPage ? (
          <TestPage />
        ) : (
          <>
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
                  <button
                    onClick={() => setShowSubmissionForm(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    + Submit New Property
                  </button>
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
                      maxPrice: newFilters.maxPrice || 0
                    })}
                    onSearch={() => console.log('Search triggered')}
                  />
                </div>

                {/* Data Status */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h2 className="text-lg font-semibold mb-3">Data Status</h2>
                  {loading && <p className="text-blue-600">Loading data...</p>}
                  {error && <p className="text-red-600">{error}</p>}
                  {comprehensiveData && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Parcels: {comprehensiveData.parcels.length}</p>
                      <p>Addresses: {comprehensiveData.addresses.length}</p>
                      <p>Submitted: {submittedProperties.length}</p>
                      {enrichedProperties.length > 0 && (
                        <p className="text-green-600">Enriched: {enrichedProperties.length}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Submitted Properties List */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h2 className="text-lg font-semibold mb-3">Your Properties</h2>
                  {filteredProperties.length === 0 ? (
                    <p className="text-gray-500 text-sm">No properties submitted yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredProperties.map(property => (
                        <div
                          key={property.id}
                          className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handlePropertyClick(property)}
                        >
                          <p className="font-medium text-gray-900 text-sm">{property.address}</p>
                          <p className="text-sm text-gray-600">${property.marketValue.toLocaleString()}</p>
                          <p className="text-xs text-blue-600">Click to view</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Map */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="h-96 rounded-lg overflow-hidden">
                    <Map
                      properties={submittedProperties}
                      comprehensiveData={comprehensiveData || undefined}
                      enrichedProperties={enrichedProperties}
                      onPropertyClick={handlePropertyClick}
                      onEnrichedPropertyClick={handleEnrichedPropertyClick}
                      layerType={currentLayer}
                      center={mapCenter}
                      zoom={mapZoom}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Property Submission Form */}
            {showSubmissionForm && (
              <FloatingPropertyForm
                isVisible={showSubmissionForm}
                onSubmit={handlePropertySubmission}
                onClose={() => setShowSubmissionForm(false)}
              />
            )}

            {/* Property Detail Card */}
            {selectedProperty && (
              <div className="fixed top-4 right-4 z-50">
                <PropertyCard
                  property={selectedProperty}
                  onClose={() => setSelectedProperty(null)}
                  onDelete={() => handleDeleteProperty(selectedProperty.id)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
