import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LayerToggle } from '../components/LayerToggle';
import type { MapLayerType } from '../components/LayerToggle';

describe('LayerToggle Component', () => {
  const mockOnLayerChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the layer toggle dropdown', () => {
    render(
      <LayerToggle 
        currentLayer="parcels" 
        onLayerChange={mockOnLayerChange} 
      />
    );

    expect(screen.getByText('Parcel Boundaries')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should display current layer as selected', () => {
    render(
      <LayerToggle 
        currentLayer="points" 
        onLayerChange={mockOnLayerChange} 
      />
    );

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('points');
  });

  it('should call onLayerChange when selection changes', () => {
    render(
      <LayerToggle 
        currentLayer="parcels" 
        onLayerChange={mockOnLayerChange} 
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'clusters' } });

    expect(mockOnLayerChange).toHaveBeenCalledWith('clusters');
  });

  it('should render all layer options', () => {
    render(
      <LayerToggle 
        currentLayer="parcels" 
        onLayerChange={mockOnLayerChange} 
      />
    );

    const select = screen.getByRole('combobox');
    const options = select.querySelectorAll('option');

    expect(options).toHaveLength(4); // parcels, points, clusters, heatmap

    // Check that all expected options are present
    const optionValues = Array.from(options).map(option => option.value);
    expect(optionValues).toContain('parcels');
    expect(optionValues).toContain('points');
    expect(optionValues).toContain('clusters');
    expect(optionValues).toContain('heatmap');
  });

  it('should have proper styling classes', () => {
    render(
      <LayerToggle 
        currentLayer="parcels" 
        onLayerChange={mockOnLayerChange} 
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('block', 'w-full', 'px-3', 'py-2');
  });

  it('should be accessible with proper labels', () => {
    render(
      <LayerToggle 
        currentLayer="parcels" 
        onLayerChange={mockOnLayerChange} 
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('aria-label', 'Select map layer');
  });

  it('should handle all layer type changes', () => {
    const layerTypes: MapLayerType[] = ['parcels', 'points', 'clusters', 'heatmap'];
    
    render(
      <LayerToggle 
        currentLayer="parcels" 
        onLayerChange={mockOnLayerChange} 
      />
    );

    const select = screen.getByRole('combobox');

    layerTypes.forEach(layerType => {
      fireEvent.change(select, { target: { value: layerType } });
      expect(mockOnLayerChange).toHaveBeenCalledWith(layerType);
    });

    expect(mockOnLayerChange).toHaveBeenCalledTimes(layerTypes.length);
  });
}); 