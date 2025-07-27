import React from 'react';
import { DollarSign, MapPin, Home, Calendar, User } from 'lucide-react';
import type { EnrichedPropertyData } from '../services/propertyDataEnrichment';

interface EnrichedPropertyListProps {
  properties: EnrichedPropertyData[];
  onPropertyClick?: (property: EnrichedPropertyData) => void;
}

export const EnrichedPropertyList: React.FC<EnrichedPropertyListProps> = ({
  properties,
  onPropertyClick
}) => {
  if (properties.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Home className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>No enriched properties available</p>
        <p className="text-sm">Click "Enrich Address Points" to generate real property data</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {properties.map((property, index) => (
        <div
          key={property.propertyId || index}
          onClick={() => onPropertyClick?.(property)}
          className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900 text-sm">{property.address}</h3>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {property.propertyType}
            </span>
          </div>

          <div className="space-y-2">
            {/* Market Value */}
            <div className="flex items-center text-sm">
              <DollarSign className="w-4 h-4 text-green-600 mr-2" />
              <span className="font-medium text-green-600">
                ${property.marketValue.toLocaleString()}
              </span>
              <span className="text-gray-500 ml-2">market value</span>
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              {property.squareFootage && (
                <div className="flex items-center">
                  <Home className="w-3 h-3 mr-1" />
                  <span>{property.squareFootage.toLocaleString()} sq ft</span>
                </div>
              )}
              
              {property.bedrooms && (
                <div className="flex items-center">
                  <span>🛏️ {property.bedrooms} beds</span>
                </div>
              )}
              
              {property.bathrooms && (
                <div className="flex items-center">
                  <span>🚿 {property.bathrooms} baths</span>
                </div>
              )}
              
              {property.yearBuilt && (
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>Built {property.yearBuilt}</span>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="text-xs text-gray-500 space-y-1">
              {property.lotSize && (
                <div>Lot Size: {property.lotSize} acres</div>
              )}
              
              {property.lastSaleDate && property.lastSalePrice && (
                <div>
                  Last sold: {property.lastSaleDate} for ${property.lastSalePrice.toLocaleString()}
                </div>
              )}
              
              {property.ownerName && (
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  <span>{property.ownerName}</span>
                </div>
              )}
            </div>

            {/* Property ID */}
            {property.propertyId && (
              <div className="text-xs text-gray-400">
                ID: {property.propertyId}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}; 