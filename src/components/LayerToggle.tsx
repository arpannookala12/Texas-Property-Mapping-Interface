import { useState } from 'react';
import { Layers } from 'lucide-react';

export type MapLayerType = 'all' | 'parcels' | 'points' | 'clusters' | 'heatmap' | 'buildings';

interface LayerToggleProps {
  currentLayer: MapLayerType;
  onLayerChange: (layer: MapLayerType) => void;
}

export const LayerToggle: React.FC<LayerToggleProps> = ({
  currentLayer,
  onLayerChange
}) => {
  const layerOptions = [
    { value: 'all', label: 'All Layers' },
    { value: 'parcels', label: 'Parcels' },
    { value: 'points', label: 'GeoJSON Points' },
    { value: 'clusters', label: 'Clustered Markers' },
    { value: 'heatmap', label: 'Heatmap' },
    { value: 'buildings', label: 'Building Footprints' }
  ];

  return (
    <div className="space-y-2">
      <label htmlFor="layer-select" className="block text-sm font-medium text-gray-700">
        Map Layer
      </label>
      <select
        id="layer-select"
        value={currentLayer}
        onChange={(e) => onLayerChange(e.target.value as MapLayerType)}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        aria-label="Select map layer"
      >
        {layerOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500">
        Select a layer to display different data types on the map
      </p>
    </div>
  );
}; 