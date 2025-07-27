import { useState } from 'react';
import { Plus, MapPin, DollarSign, Home, FileText } from 'lucide-react';
import type { Property } from '../types';

export interface PropertySubmission {
  address: string;
  price: number;
  acreage: number;
  propertyType: 'residential' | 'commercial' | 'industrial' | 'agricultural' | 'vacant';
  description: string;
  coordinates?: { lat: number; lng: number };
  parcelId?: string;
}

interface PropertySubmissionFormProps {
  onSubmit: (submission: PropertySubmission) => void;
  onCancel: () => void;
  isVisible: boolean;
}

export const PropertySubmissionForm: React.FC<PropertySubmissionFormProps> = ({
  onSubmit,
  onCancel,
  isVisible
}) => {
  const [formData, setFormData] = useState<PropertySubmission>({
    address: '',
    price: 0,
    acreage: 0,
    propertyType: 'residential',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.address && formData.price > 0) {
      onSubmit(formData);
      // Reset form
      setFormData({
        address: '',
        price: 0,
        acreage: 0,
        propertyType: 'residential',
        description: ''
      });
    }
  };

  const handleInputChange = (field: keyof PropertySubmission, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Submit New Property
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Address *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter property address"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                Price *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.price || ''}
                onChange={(e) => handleInputChange('price', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter property price"
              />
            </div>

            {/* Acreage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Home className="w-4 h-4 mr-1" />
                Acreage
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.acreage || ''}
                onChange={(e) => handleInputChange('acreage', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter acreage"
              />
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type *
              </label>
              <select
                required
                value={formData.propertyType}
                onChange={(e) => handleInputChange('propertyType', e.target.value as PropertySubmission['propertyType'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
                <option value="agricultural">Agricultural</option>
                <option value="vacant">Vacant</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter property description"
              />
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 btn-primary"
              >
                Submit Property
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 