import { describe, it, expect } from 'vitest';
import type { Property, MapViewport, SearchFilters, PropertySearchResult } from '../types';

describe('Types', () => {
  describe('Property interface', () => {
    it('should have required properties', () => {
      const property: Property = {
        id: 'test-1',
        address: '123 Test St',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        owner: 'John Doe',
        marketValue: 500000,
        propertyType: 'residential',
        coordinates: {
          lat: 30.2672,
          lng: -97.7431
        }
      };

      expect(property.id).toBe('test-1');
      expect(property.address).toBe('123 Test St');
      expect(property.propertyType).toBe('residential');
      expect(property.coordinates.lat).toBe(30.2672);
      expect(property.coordinates.lng).toBe(-97.7431);
    });

    it('should support optional properties', () => {
      const property: Property = {
        id: 'test-2',
        address: '456 Test Ave',
        city: 'Austin',
        state: 'TX',
        zipCode: '78702',
        owner: 'Jane Smith',
        marketValue: 750000,
        propertyType: 'commercial',
        coordinates: {
          lat: 30.2672,
          lng: -97.7431
        },
        acreage: 2.5,
        description: 'Test property description',
        submittedAt: '2024-01-01T00:00:00Z',
        status: 'pending'
      };

      expect(property.acreage).toBe(2.5);
      expect(property.description).toBe('Test property description');
      expect(property.status).toBe('pending');
    });
  });

  describe('MapViewport interface', () => {
    it('should have required properties', () => {
      const viewport: MapViewport = {
        latitude: 30.2672,
        longitude: -97.7431,
        zoom: 10
      };

      expect(viewport.latitude).toBe(30.2672);
      expect(viewport.longitude).toBe(-97.7431);
      expect(viewport.zoom).toBe(10);
    });

    it('should support optional bearing and pitch', () => {
      const viewport: MapViewport = {
        latitude: 30.2672,
        longitude: -97.7431,
        zoom: 10,
        bearing: 45,
        pitch: 30
      };

      expect(viewport.bearing).toBe(45);
      expect(viewport.pitch).toBe(30);
    });
  });

  describe('SearchFilters interface', () => {
    it('should support all filter properties', () => {
      const filters: SearchFilters = {
        address: 'Test',
        propertyType: 'residential',
        minPrice: 100000,
        maxPrice: 500000,
        city: 'Austin',
        state: 'TX'
      };

      expect(filters.address).toBe('Test');
      expect(filters.propertyType).toBe('residential');
      expect(filters.minPrice).toBe(100000);
      expect(filters.maxPrice).toBe(500000);
      expect(filters.city).toBe('Austin');
      expect(filters.state).toBe('TX');
    });
  });

  describe('PropertySearchResult interface', () => {
    it('should have required properties', () => {
      const result: PropertySearchResult = {
        properties: [],
        total: 0,
        page: 1,
        pageSize: 10
      };

      expect(result.properties).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });
  });
}); 