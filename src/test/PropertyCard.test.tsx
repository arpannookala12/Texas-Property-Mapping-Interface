import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyCard } from '../components/PropertyCard';
import type { Property } from '../types';

describe('PropertyCard Component', () => {
  const mockOnClose = vi.fn();

  const mockProperty: Property = {
    id: 'test-1',
    address: '123 Test Street',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    owner: 'John Doe',
    marketValue: 500000,
    propertyType: 'residential',
    coordinates: {
      lat: 30.2672,
      lng: -97.7431
    },
    acreage: 0.5,
    description: 'A beautiful residential property',
    submittedAt: '2024-01-01T00:00:00Z',
    status: 'pending'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render property information correctly', () => {
    render(
      <PropertyCard 
        property={mockProperty} 
        onClose={mockOnClose} 
      />
    );

    expect(screen.getByText('123 Test Street')).toBeInTheDocument();
    expect(screen.getByText('Austin, TX 78701')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('$500,000')).toBeInTheDocument();
    expect(screen.getByText('Residential')).toBeInTheDocument();
    expect(screen.getByText('0.5 acres')).toBeInTheDocument();
    expect(screen.getByText('A beautiful residential property')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <PropertyCard 
        property={mockProperty} 
        onClose={mockOnClose} 
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display status with correct styling', () => {
    render(
      <PropertyCard 
        property={mockProperty} 
        onClose={mockOnClose} 
      />
    );

    const statusElement = screen.getByText('Pending Review');
    expect(statusElement).toBeInTheDocument();
  });

  it('should display approved status correctly', () => {
    const approvedProperty = { ...mockProperty, status: 'approved' as const };
    
    render(
      <PropertyCard 
        property={approvedProperty} 
        onClose={mockOnClose} 
      />
    );

    const statusElement = screen.getByText('Approved');
    expect(statusElement).toBeInTheDocument();
  });

  it('should display rejected status correctly', () => {
    const rejectedProperty = { ...mockProperty, status: 'rejected' as const };
    
    render(
      <PropertyCard 
        property={rejectedProperty} 
        onClose={mockOnClose} 
      />
    );

    const statusElement = screen.getByText('Rejected');
    expect(statusElement).toBeInTheDocument();
  });

  it('should handle missing optional properties gracefully', () => {
    const minimalProperty: Property = {
      id: 'test-2',
      address: '456 Minimal Ave',
      city: 'Austin',
      state: 'TX',
      zipCode: '78702',
      owner: 'Jane Smith',
      marketValue: 300000,
      propertyType: 'commercial',
      coordinates: {
        lat: 30.2672,
        lng: -97.7431
      }
    };

    render(
      <PropertyCard 
        property={minimalProperty} 
        onClose={mockOnClose} 
      />
    );

    expect(screen.getByText('456 Minimal Ave')).toBeInTheDocument();
    expect(screen.getByText('Commercial')).toBeInTheDocument();
    expect(screen.getByText('$300,000')).toBeInTheDocument();
    
    // Should not show acreage or description if not provided
    expect(screen.queryByText(/acres/)).not.toBeInTheDocument();
    expect(screen.queryByText(/description/)).not.toBeInTheDocument();
  });

  it('should format large numbers correctly', () => {
    const expensiveProperty = { 
      ...mockProperty, 
      marketValue: 2500000,
      address: '789 Expensive Blvd'
    };

    render(
      <PropertyCard 
        property={expensiveProperty} 
        onClose={mockOnClose} 
      />
    );

    expect(screen.getByText('$2,500,000')).toBeInTheDocument();
  });

  it('should format acreage correctly', () => {
    const largeProperty = { 
      ...mockProperty, 
      acreage: 15.75,
      address: '321 Large Property Rd'
    };

    render(
      <PropertyCard 
        property={largeProperty} 
        onClose={mockOnClose} 
      />
    );

    expect(screen.getByText('15.75 acres')).toBeInTheDocument();
  });

  it('should render property details header', () => {
    render(
      <PropertyCard 
        property={mockProperty} 
        onClose={mockOnClose} 
      />
    );

    expect(screen.getByText('Property Details')).toBeInTheDocument();
  });

  it('should have proper close button accessibility', () => {
    render(
      <PropertyCard 
        property={mockProperty} 
        onClose={mockOnClose} 
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });
}); 