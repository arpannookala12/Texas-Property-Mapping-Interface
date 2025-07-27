
import { X, MapPin, DollarSign, Home, Calendar, User, Ruler, FileText, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import type { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  onClose: () => void;
  onDelete?: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClose, onDelete }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending Review';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Home className="w-5 h-5 mr-2" />
          Property Details
        </h3>
        <div className="flex items-center space-x-2">
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-600 transition-colors"
              title="Delete property"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Address */}
        <div className="flex items-start">
          <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">{property.address}</p>
            <p className="text-sm text-gray-600">
              {property.city}, {property.state} {property.zipCode}
            </p>
          </div>
        </div>

        {/* Status (for submitted properties) */}
        {property.status && (
          <div className="flex items-center">
            {getStatusIcon(property.status)}
            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(property.status)}`}>
              {getStatusText(property.status)}
            </span>
          </div>
        )}

        {/* Property Type */}
        <div className="flex items-center">
          <Home className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-600">
            Type: <span className="font-medium text-gray-900 capitalize">{property.propertyType}</span>
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center">
          <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-600">
            Market Value: <span className="font-medium text-gray-900">{formatCurrency(property.marketValue)}</span>
          </span>
        </div>

        {/* Acreage (if available) */}
        {property.acreage && property.acreage > 0 && (
          <div className="flex items-center">
            <Ruler className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">
              Acreage: <span className="font-medium text-gray-900">{property.acreage} acres</span>
            </span>
          </div>
        )}

        {/* Owner */}
        <div className="flex items-center">
          <User className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-600">
            Owner: <span className="font-medium text-gray-900">{property.owner}</span>
          </span>
        </div>

        {/* Additional Property Details */}
        {property.yearBuilt && (
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">
              Year Built: <span className="font-medium text-gray-900">{property.yearBuilt}</span>
            </span>
          </div>
        )}

        {property.squareFootage && property.squareFootage > 0 && (
          <div className="flex items-center">
            <Ruler className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">
              Square Footage: <span className="font-medium text-gray-900">{property.squareFootage.toLocaleString()} sq ft</span>
            </span>
          </div>
        )}

        {property.bedrooms && (
          <div className="flex items-center">
            <Home className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">
              Bedrooms: <span className="font-medium text-gray-900">{property.bedrooms}</span>
            </span>
          </div>
        )}

        {property.bathrooms && (
          <div className="flex items-center">
            <Home className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">
              Bathrooms: <span className="font-medium text-gray-900">{property.bathrooms}</span>
            </span>
          </div>
        )}

        {/* Description (for submitted properties) */}
        {property.description && (
          <div className="flex items-start">
            <FileText className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Description:</p>
              <p className="text-sm text-gray-600">{property.description}</p>
            </div>
          </div>
        )}

        {/* Submitted Date (for submitted properties) */}
        {property.submittedAt && (
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">
              Submitted: <span className="font-medium text-gray-900">
                {new Date(property.submittedAt).toLocaleDateString()}
              </span>
            </span>
          </div>
        )}

        {/* Property ID */}
        {property.parcelId && (
          <div className="text-xs text-gray-500">
            Parcel ID: {property.parcelId}
          </div>
        )}

        {/* Coordinates */}
        <div className="text-xs text-gray-500">
          Coordinates: {property.coordinates.lat.toFixed(6)}, {property.coordinates.lng.toFixed(6)}
        </div>
      </div>
    </div>
  );
}; 