import type { Property } from '../types';
import type { PropertySubmission } from '../components/FloatingPropertyForm';

const STORAGE_KEY = 'submitted_properties';

// Convert PropertySubmission to Property
export const convertSubmissionToProperty = (submission: PropertySubmission): Property => {
  return {
    id: `submitted-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    address: submission.address,
    city: submission.city,
    state: submission.state,
    zipCode: submission.zipCode,
    marketValue: submission.price,
    propertyType: submission.propertyType as Property['propertyType'],
    owner: 'User Submitted',
    coordinates: submission.coordinates,
    // Additional fields from the new form
    acreage: submission.acreage,
    description: submission.description,
    submittedAt: new Date().toISOString(),
    status: 'pending'
  };
};

// Load properties from localStorage
export const loadProperties = (): Property[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure all properties have the required fields
      return parsed.map((property: any) => ({
        id: property.id || `legacy-${Date.now()}`,
        address: property.address || 'Unknown Address',
        city: property.city || 'Austin',
        state: property.state || 'TX',
        zipCode: property.zipCode || '00000',
        marketValue: property.marketValue || property.price || 0,
        propertyType: property.propertyType || 'residential',
        owner: property.owner || 'Unknown Owner',
        coordinates: property.coordinates || { lat: 30.2672, lng: -97.7431 },
        acreage: property.acreage || 0,
        description: property.description || property.notes || '',
        submittedAt: property.submittedAt || new Date().toISOString(),
        status: property.status || 'pending'
      }));
    }
    return [];
  } catch (error) {
    console.error('Error loading properties from localStorage:', error);
    return [];
  }
};

// Save properties to localStorage
export const saveProperties = (properties: Property[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
  } catch (error) {
    console.error('Error saving properties to localStorage:', error);
  }
};

// Add a new property
export const addProperty = (submission: PropertySubmission): Property => {
  const newProperty = convertSubmissionToProperty(submission);
  const existingProperties = loadProperties();
  const updatedProperties = [...existingProperties, newProperty];
  saveProperties(updatedProperties);
  return newProperty;
};

// Update a property
export const updateProperty = (id: string, updates: Partial<Property>): Property | null => {
  const properties = loadProperties();
  const index = properties.findIndex(p => p.id === id);
  
  if (index === -1) {
    return null;
  }
  
  const updatedProperty = { ...properties[index], ...updates };
  properties[index] = updatedProperty;
  saveProperties(properties);
  return updatedProperty;
};

// Delete a property
export const deleteProperty = (id: string): boolean => {
  const properties = loadProperties();
  const filteredProperties = properties.filter(p => p.id !== id);
  
  if (filteredProperties.length === properties.length) {
    return false; // Property not found
  }
  
  saveProperties(filteredProperties);
  return true;
};

// Get property by ID
export const getProperty = (id: string): Property | null => {
  const properties = loadProperties();
  return properties.find(p => p.id === id) || null;
};

// Search properties
export const searchProperties = (query: {
  address?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
}): Property[] => {
  const properties = loadProperties();
  
  return properties.filter(property => {
    if (query.address && !property.address.toLowerCase().includes(query.address.toLowerCase())) {
      return false;
    }
    
    if (query.propertyType && property.propertyType !== query.propertyType) {
      return false;
    }
    
    if (query.minPrice !== undefined && property.marketValue < query.minPrice) {
      return false;
    }
    
    if (query.maxPrice !== undefined && property.marketValue > query.maxPrice) {
      return false;
    }
    
    if (query.city && !property.city.toLowerCase().includes(query.city.toLowerCase())) {
      return false;
    }
    
    return true;
  });
};

// Get property statistics
export const getPropertyStatistics = () => {
  const properties = loadProperties();
  
  const total = properties.length;
  const pending = properties.filter(p => p.status === 'pending').length;
  const approved = properties.filter(p => p.status === 'approved').length;
  const rejected = properties.filter(p => p.status === 'rejected').length;
  const totalValue = properties.reduce((sum, p) => sum + p.marketValue, 0);
  const averageValue = total > 0 ? totalValue / total : 0;
  
  return {
    total,
    pending,
    approved,
    rejected,
    totalValue,
    averageValue
  };
};

// Export properties as JSON
export const exportProperties = (): string => {
  const properties = loadProperties();
  return JSON.stringify(properties, null, 2);
};

// Import properties from JSON
export const importProperties = (jsonData: string): boolean => {
  try {
    const properties = JSON.parse(jsonData);
    if (Array.isArray(properties)) {
      saveProperties(properties);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error importing properties:', error);
    return false;
  }
};

// Clear all properties
export const clearAllProperties = (): void => {
  localStorage.removeItem(STORAGE_KEY);
}; 