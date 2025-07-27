import { useState } from 'react';
import { Layers } from 'lucide-react';

export type MapLayerType = 'parcels' | 'points' | 'clusters' | 'heatmap';

interface LayerToggleProps {
  currentLayer: MapLayerType;
  onLayerChange: (layer: MapLayerType) => void;
}

export const LayerToggle: React.FC<LayerToggleProps> = ({ currentLayer, onLayerChange }) => {
  const layerOptions = [
    { value: 'parcels', label: 'Parcel Boundaries', description: 'Travis County parcel boundaries' },
    { value: 'points', label: 'Address Points', description: 'Individual address points' },
    { value: 'clusters', label: 'Clustered Markers', description: 'Grouped property markers' },
    { value: 'heatmap', label: 'Heatmap Layer', description: 'Property density heatmap' }
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
        {layerOptions.find(opt => opt.value === currentLayer)?.description}
      </p>
    </div>
  );
}; 