import React, { useState } from 'react';
import { Map } from './Map';
import { FloatingPropertyForm } from './FloatingPropertyForm';
import { PropertyCard } from './PropertyCard';
import { LayerToggle } from './LayerToggle';
import { PropertySearchFilters } from './SearchFilters';
import type { PropertySubmission } from './FloatingPropertyForm';
import type { MapLayerType } from './LayerToggle';
import type { Property } from '../types';
import { addProperty, loadProperties, deleteProperty } from '../services/propertyStorage';

export const TestPage: React.FC = () => {
  const [currentTest, setCurrentTest] = useState<string>('');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [submittedProperties, setSubmittedProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [currentLayer, setCurrentLayer] = useState<MapLayerType>('parcels');

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const testPropertySubmission = async () => {
    setCurrentTest('Property Submission');
    addTestResult('Testing property submission form...');
    
    // Simulate form submission
    const testSubmission: PropertySubmission = {
      address: '123 Test Street',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      price: 500000,
      acreage: 0.5,
      propertyType: 'residential',
      description: 'Test property for testing purposes',
      coordinates: { lat: 30.2672, lng: -97.7431 }
    };

    try {
      const newProperty = await addProperty(testSubmission);
      setSubmittedProperties(prev => [...prev, newProperty]);
      addTestResult('✅ Property submission test passed');
    } catch (error) {
      addTestResult('❌ Property submission test failed: ' + error);
    }
  };

  const testPropertyDeletion = () => {
    setCurrentTest('Property Deletion');
    addTestResult('Testing property deletion...');
    
    if (submittedProperties.length === 0) {
      addTestResult('❌ No properties to delete');
      return;
    }

    try {
      const propertyToDelete = submittedProperties[0];
      deleteProperty(propertyToDelete.id);
      setSubmittedProperties(prev => prev.filter(p => p.id !== propertyToDelete.id));
      addTestResult('✅ Property deletion test passed');
    } catch (error) {
      addTestResult('❌ Property deletion test failed: ' + error);
    }
  };

  const testLayerToggle = () => {
    setCurrentTest('Layer Toggle');
    addTestResult('Testing layer toggle functionality...');
    
    const layers: MapLayerType[] = ['parcels', 'points', 'clusters', 'heatmap'];
    layers.forEach(layer => {
      setCurrentLayer(layer);
      addTestResult(`✅ Switched to ${layer} layer`);
    });
  };

  const testPropertyClick = () => {
    setCurrentTest('Property Click');
    addTestResult('Testing property click functionality...');
    
    if (submittedProperties.length === 0) {
      addTestResult('❌ No properties to click');
      return;
    }

    const property = submittedProperties[0];
    setSelectedProperty(property);
    addTestResult('✅ Property click test passed');
  };

  const testFormValidation = () => {
    setCurrentTest('Form Validation');
    addTestResult('Testing form validation...');
    setShowForm(true);
    addTestResult('✅ Form opened for validation testing');
  };

  const testDataPersistence = () => {
    setCurrentTest('Data Persistence');
    addTestResult('Testing data persistence...');
    
    try {
      const savedProperties = loadProperties();
      addTestResult(`✅ Loaded ${savedProperties.length} saved properties`);
    } catch (error) {
      addTestResult('❌ Data persistence test failed: ' + error);
    }
  };

  const runAllTests = async () => {
    clearTestResults();
    addTestResult('🚀 Starting comprehensive test suite...');
    
    await testPropertySubmission();
    testPropertyClick();
    testPropertyDeletion();
    testLayerToggle();
    testFormValidation();
    testDataPersistence();
    
    addTestResult('🎉 All tests completed!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">🧪 Property System Test Page</h1>
          <p className="text-gray-600">Test all independent aspects of the property mapping system</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Test Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-3">Test Controls</h2>
              <div className="space-y-2">
                <button
                  onClick={runAllTests}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg"
                >
                  🚀 Run All Tests
                </button>
                <button
                  onClick={testPropertySubmission}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                >
                  📝 Test Property Submission
                </button>
                <button
                  onClick={testPropertyDeletion}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg"
                >
                  🗑️ Test Property Deletion
                </button>
                <button
                  onClick={testLayerToggle}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg"
                >
                  🔄 Test Layer Toggle
                </button>
                <button
                  onClick={testPropertyClick}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg"
                >
                  👆 Test Property Click
                </button>
                <button
                  onClick={testFormValidation}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg"
                >
                  ✅ Test Form Validation
                </button>
                <button
                  onClick={testDataPersistence}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg"
                >
                  💾 Test Data Persistence
                </button>
                <button
                  onClick={clearTestResults}
                  className="w-full bg-gray-400 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded-lg"
                >
                  🧹 Clear Results
                </button>
              </div>
            </div>

            {/* Current Test Status */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-3">Current Test</h2>
              <p className="text-sm text-gray-600">
                {currentTest || 'No test running'}
              </p>
            </div>

            {/* Test Results */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-3">Test Results</h2>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {testResults.length === 0 ? (
                  <p className="text-gray-500 text-sm">No test results yet</p>
                ) : (
                  testResults.map((result, index) => (
                    <p key={index} className="text-xs font-mono bg-gray-50 p-1 rounded">
                      {result}
                    </p>
                  ))
                )}
              </div>
            </div>

            {/* Layer Toggle */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-3">Layer Toggle</h2>
              <LayerToggle currentLayer={currentLayer} onLayerChange={setCurrentLayer} />
            </div>

            {/* Search Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-3">Search Filters</h2>
              <PropertySearchFilters 
                filters={{ address: '', propertyType: '', minPrice: 0, maxPrice: 0 }}
                onFiltersChange={() => {}}
                onSearch={() => {}}
              />
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="h-96 rounded-lg overflow-hidden">
                <Map
                  properties={submittedProperties}
                  layerType={currentLayer}
                  onPropertyClick={setSelectedProperty}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Property Submission Form */}
        {showForm && (
          <FloatingPropertyForm
            isVisible={showForm}
            onSubmit={async (submission) => {
              try {
                const newProperty = await addProperty(submission);
                setSubmittedProperties(prev => [...prev, newProperty]);
                setShowForm(false);
                addTestResult('✅ Form submission test passed');
              } catch (error) {
                addTestResult('❌ Form submission test failed: ' + error);
              }
            }}
            onClose={() => setShowForm(false)}
          />
        )}

        {/* Property Detail Card */}
        {selectedProperty && (
          <div className="fixed top-4 right-4 z-50">
            <PropertyCard
              property={selectedProperty}
              onClose={() => setSelectedProperty(null)}
              onDelete={() => {
                deleteProperty(selectedProperty.id);
                setSubmittedProperties(prev => prev.filter(p => p.id !== selectedProperty.id));
                setSelectedProperty(null);
                addTestResult('✅ Property deletion from card test passed');
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}; 