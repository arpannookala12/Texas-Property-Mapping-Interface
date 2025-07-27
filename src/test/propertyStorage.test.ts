import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  loadProperties, 
  saveProperties, 
  addProperty, 
  updateProperty, 
  deleteProperty, 
  getProperty,
  searchProperties,
  getPropertyStatistics,
  clearAllProperties,
  convertSubmissionToProperty
} from '../services/propertyStorage';
import type { Property } from '../types';
import type { PropertySubmission } from '../components/FloatingPropertyForm';

describe('Property Storage Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('loadProperties', () => {
    it('should return empty array when no properties exist', () => {
      const properties = loadProperties();
      expect(properties).toEqual([]);
    });

    it('should load properties from localStorage', () => {
      const mockProperties: Property[] = [
        {
          id: 'test-1',
          address: '123 Test St',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          owner: 'John Doe',
          marketValue: 500000,
          propertyType: 'residential',
          coordinates: { lat: 30.2672, lng: -97.7431 }
        }
      ];

      localStorage.setItem('submitted_properties', JSON.stringify(mockProperties));
      const properties = loadProperties();
      expect(properties).toEqual(mockProperties);
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('submitted_properties', 'invalid-json');
      const properties = loadProperties();
      expect(properties).toEqual([]);
    });
  });

  describe('saveProperties', () => {
    it('should save properties to localStorage', () => {
      const properties: Property[] = [
        {
          id: 'test-1',
          address: '123 Test St',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          owner: 'John Doe',
          marketValue: 500000,
          propertyType: 'residential',
          coordinates: { lat: 30.2672, lng: -97.7431 }
        }
      ];

      saveProperties(properties);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'submitted_properties',
        JSON.stringify(properties)
      );
    });
  });

  describe('addProperty', () => {
    it('should add a new property', () => {
      const submission: PropertySubmission = {
        address: '123 Test St',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        price: 500000,
        acreage: 0.5,
        propertyType: 'residential',
        description: 'Test property',
        coordinates: { lat: 30.2672, lng: -97.7431 }
      };

      const property = addProperty(submission);
      
      expect(property.id).toMatch(/^submitted-\d+-\w+$/);
      expect(property.address).toBe('123 Test St');
      expect(property.marketValue).toBe(500000);
      expect(property.status).toBe('pending');
      expect(property.submittedAt).toBeDefined();
    });
  });

  describe('updateProperty', () => {
    it('should update an existing property', () => {
      const properties: Property[] = [
        {
          id: 'test-1',
          address: '123 Test St',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          owner: 'John Doe',
          marketValue: 500000,
          propertyType: 'residential',
          coordinates: { lat: 30.2672, lng: -97.7431 }
        }
      ];

      localStorage.setItem('submitted_properties', JSON.stringify(properties));
      
      const updatedProperty = updateProperty('test-1', { status: 'approved' });
      
      expect(updatedProperty).toBeDefined();
      expect(updatedProperty?.status).toBe('approved');
    });

    it('should return null for non-existent property', () => {
      const result = updateProperty('non-existent', { status: 'approved' });
      expect(result).toBeNull();
    });
  });

  describe('deleteProperty', () => {
    it('should delete an existing property', () => {
      const properties: Property[] = [
        {
          id: 'test-1',
          address: '123 Test St',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          owner: 'John Doe',
          marketValue: 500000,
          propertyType: 'residential',
          coordinates: { lat: 30.2672, lng: -97.7431 }
        }
      ];

      localStorage.setItem('submitted_properties', JSON.stringify(properties));
      
      const result = deleteProperty('test-1');
      expect(result).toBe(true);
    });

    it('should return false for non-existent property', () => {
      const result = deleteProperty('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('getProperty', () => {
    it('should return property by ID', () => {
      const properties: Property[] = [
        {
          id: 'test-1',
          address: '123 Test St',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          owner: 'John Doe',
          marketValue: 500000,
          propertyType: 'residential',
          coordinates: { lat: 30.2672, lng: -97.7431 }
        }
      ];

      localStorage.setItem('submitted_properties', JSON.stringify(properties));
      
      const property = getProperty('test-1');
      expect(property).toEqual(properties[0]);
    });

    it('should return null for non-existent property', () => {
      const property = getProperty('non-existent');
      expect(property).toBeNull();
    });
  });

  describe('searchProperties', () => {
    it('should search by address', () => {
      const properties: Property[] = [
        {
          id: 'test-1',
          address: '123 Test St',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          owner: 'John Doe',
          marketValue: 500000,
          propertyType: 'residential',
          coordinates: { lat: 30.2672, lng: -97.7431 }
        },
        {
          id: 'test-2',
          address: '456 Oak Ave',
          city: 'Austin',
          state: 'TX',
          zipCode: '78702',
          owner: 'Jane Smith',
          marketValue: 750000,
          propertyType: 'commercial',
          coordinates: { lat: 30.2672, lng: -97.7431 }
        }
      ];

      localStorage.setItem('submitted_properties', JSON.stringify(properties));
      
      const results = searchProperties({ address: 'Test' });
      expect(results).toHaveLength(1);
      expect(results[0].address).toBe('123 Test St');
    });

    it('should search by property type', () => {
      const properties: Property[] = [
        {
          id: 'test-1',
          address: '123 Test St',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          owner: 'John Doe',
          marketValue: 500000,
          propertyType: 'residential',
          coordinates: { lat: 30.2672, lng: -97.7431 }
        },
        {
          id: 'test-2',
          address: '456 Oak Ave',
          city: 'Austin',
          state: 'TX',
          zipCode: '78702',
          owner: 'Jane Smith',
          marketValue: 750000,
          propertyType: 'commercial',
          coordinates: { lat: 30.2672, lng: -97.7431 }
        }
      ];

      localStorage.setItem('submitted_properties', JSON.stringify(properties));
      
      const results = searchProperties({ propertyType: 'commercial' });
      expect(results).toHaveLength(1);
      expect(results[0].propertyType).toBe('commercial');
    });
  });

  describe('getPropertyStatistics', () => {
    it('should calculate statistics correctly', () => {
      const properties: Property[] = [
        {
          id: 'test-1',
          address: '123 Test St',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          owner: 'John Doe',
          marketValue: 500000,
          propertyType: 'residential',
          coordinates: { lat: 30.2672, lng: -97.7431 },
          status: 'pending'
        },
        {
          id: 'test-2',
          address: '456 Oak Ave',
          city: 'Austin',
          state: 'TX',
          zipCode: '78702',
          owner: 'Jane Smith',
          marketValue: 750000,
          propertyType: 'commercial',
          coordinates: { lat: 30.2672, lng: -97.7431 },
          status: 'approved'
        }
      ];

      localStorage.setItem('submitted_properties', JSON.stringify(properties));
      
      const stats = getPropertyStatistics();
      expect(stats.total).toBe(2);
      expect(stats.pending).toBe(1);
      expect(stats.approved).toBe(1);
      expect(stats.rejected).toBe(0);
      expect(stats.totalValue).toBe(1250000);
      expect(stats.averageValue).toBe(625000);
    });
  });

  describe('clearAllProperties', () => {
    it('should clear all properties', () => {
      const properties: Property[] = [
        {
          id: 'test-1',
          address: '123 Test St',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          owner: 'John Doe',
          marketValue: 500000,
          propertyType: 'residential',
          coordinates: { lat: 30.2672, lng: -97.7431 }
        }
      ];

      localStorage.setItem('submitted_properties', JSON.stringify(properties));
      clearAllProperties();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('submitted_properties');
    });
  });

  describe('convertSubmissionToProperty', () => {
    it('should convert PropertySubmission to Property', () => {
      const submission: PropertySubmission = {
        address: '123 Test St',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        price: 500000,
        acreage: 0.5,
        propertyType: 'residential',
        description: 'Test property',
        coordinates: { lat: 30.2672, lng: -97.7431 }
      };

      const property = convertSubmissionToProperty(submission);
      
      expect(property.address).toBe('123 Test St');
      expect(property.marketValue).toBe(500000);
      expect(property.acreage).toBe(0.5);
      expect(property.description).toBe('Test property');
      expect(property.id).toMatch(/^submitted-\d+-\w+$/);
      expect(property.status).toBe('pending');
      expect(property.submittedAt).toBeDefined();
    });
  });
}); 