// Backend service for handling data storage and API calls
// This simulates a real backend API with local storage fallback

export interface BackendProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  marketValue: number;
  acreage?: number;
  description?: string;
  owner?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface BackendResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class BackendService {
  private baseUrl = 'http://localhost:3001/api'; // Simulated backend URL
  private useLocalStorage = true; // Fallback to localStorage

  // Check if backend is available
  private async checkBackend(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.log('Backend not available, using localStorage fallback');
      return false;
    }
  }

  // Submit a new property
  async submitProperty(property: Omit<BackendProperty, 'id' | 'submittedAt' | 'status'>): Promise<BackendResponse<BackendProperty>> {
    const backendAvailable = await this.checkBackend();
    
    if (backendAvailable) {
      try {
        const response = await fetch(`${this.baseUrl}/properties`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(property),
        });

        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        } else {
          const error = await response.text();
          return { success: false, error };
        }
      } catch (error) {
        console.error('Backend submission failed:', error);
        // Fallback to localStorage
        this.useLocalStorage = true;
      }
    }

    // localStorage fallback
    if (this.useLocalStorage) {
      try {
        const newProperty: BackendProperty = {
          ...property,
          id: `submitted-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          submittedAt: new Date().toISOString(),
          status: 'pending'
        };

        const storedProperties = this.getStoredProperties();
        storedProperties.push(newProperty);
        localStorage.setItem('submitted_properties', JSON.stringify(storedProperties));

        return { success: true, data: newProperty, message: 'Property submitted successfully (local storage)' };
      } catch (error) {
        return { success: false, error: 'Failed to store property locally' };
      }
    }

    return { success: false, error: 'No storage method available' };
  }

  // Get all submitted properties
  async getSubmittedProperties(): Promise<BackendResponse<BackendProperty[]>> {
    const backendAvailable = await this.checkBackend();
    
    if (backendAvailable) {
      try {
        const response = await fetch(`${this.baseUrl}/properties`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        } else {
          const error = await response.text();
          return { success: false, error };
        }
      } catch (error) {
        console.error('Backend fetch failed:', error);
        this.useLocalStorage = true;
      }
    }

    // localStorage fallback
    if (this.useLocalStorage) {
      try {
        const properties = this.getStoredProperties();
        return { success: true, data: properties, message: 'Loaded from local storage' };
      } catch (error) {
        return { success: false, error: 'Failed to load properties from local storage' };
      }
    }

    return { success: false, error: 'No storage method available' };
  }

  // Search properties
  async searchProperties(query: {
    address?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    city?: string;
  }): Promise<BackendResponse<BackendProperty[]>> {
    const backendAvailable = await this.checkBackend();
    
    if (backendAvailable) {
      try {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString());
          }
        });

        const response = await fetch(`${this.baseUrl}/properties/search?${params}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        } else {
          const error = await response.text();
          return { success: false, error };
        }
      } catch (error) {
        console.error('Backend search failed:', error);
        this.useLocalStorage = true;
      }
    }

    // localStorage fallback with basic filtering
    if (this.useLocalStorage) {
      try {
        const properties = this.getStoredProperties();
        let filtered = properties;

        if (query.address) {
          filtered = filtered.filter(p => 
            p.address.toLowerCase().includes(query.address!.toLowerCase())
          );
        }

        if (query.propertyType) {
          filtered = filtered.filter(p => 
            p.propertyType.toLowerCase() === query.propertyType!.toLowerCase()
          );
        }

        if (query.minPrice !== undefined) {
          filtered = filtered.filter(p => p.marketValue >= query.minPrice!);
        }

        if (query.maxPrice !== undefined) {
          filtered = filtered.filter(p => p.marketValue <= query.maxPrice!);
        }

        if (query.city) {
          filtered = filtered.filter(p => 
            p.city.toLowerCase().includes(query.city!.toLowerCase())
          );
        }

        return { success: true, data: filtered, message: 'Search results from local storage' };
      } catch (error) {
        return { success: false, error: 'Failed to search properties' };
      }
    }

    return { success: false, error: 'No storage method available' };
  }

  // Update property status (approve/reject)
  async updatePropertyStatus(propertyId: string, status: 'approved' | 'rejected'): Promise<BackendResponse<BackendProperty>> {
    const backendAvailable = await this.checkBackend();
    
    if (backendAvailable) {
      try {
        const response = await fetch(`${this.baseUrl}/properties/${propertyId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        });

        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        } else {
          const error = await response.text();
          return { success: false, error };
        }
      } catch (error) {
        console.error('Backend status update failed:', error);
        this.useLocalStorage = true;
      }
    }

    // localStorage fallback
    if (this.useLocalStorage) {
      try {
        const properties = this.getStoredProperties();
        const propertyIndex = properties.findIndex(p => p.id === propertyId);
        
        if (propertyIndex !== -1) {
          properties[propertyIndex].status = status;
          localStorage.setItem('submitted_properties', JSON.stringify(properties));
          return { success: true, data: properties[propertyIndex], message: 'Status updated in local storage' };
        } else {
          return { success: false, error: 'Property not found' };
        }
      } catch (error) {
        return { success: false, error: 'Failed to update property status' };
      }
    }

    return { success: false, error: 'No storage method available' };
  }

  // Get property statistics
  async getPropertyStatistics(): Promise<BackendResponse<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    averageValue: number;
    totalValue: number;
  }>> {
    const backendAvailable = await this.checkBackend();
    
    if (backendAvailable) {
      try {
        const response = await fetch(`${this.baseUrl}/properties/statistics`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        } else {
          const error = await response.text();
          return { success: false, error };
        }
      } catch (error) {
        console.error('Backend statistics failed:', error);
        this.useLocalStorage = true;
      }
    }

    // localStorage fallback
    if (this.useLocalStorage) {
      try {
        const properties = this.getStoredProperties();
        const total = properties.length;
        const pending = properties.filter(p => p.status === 'pending').length;
        const approved = properties.filter(p => p.status === 'approved').length;
        const rejected = properties.filter(p => p.status === 'rejected').length;
        const totalValue = properties.reduce((sum, p) => sum + p.marketValue, 0);
        const averageValue = total > 0 ? totalValue / total : 0;

        return {
          success: true,
          data: {
            total,
            pending,
            approved,
            rejected,
            averageValue,
            totalValue
          },
          message: 'Statistics from local storage'
        };
      } catch (error) {
        return { success: false, error: 'Failed to calculate statistics' };
      }
    }

    return { success: false, error: 'No storage method available' };
  }

  // Private helper methods
  private getStoredProperties(): BackendProperty[] {
    const stored = localStorage.getItem('submitted_properties');
    return stored ? JSON.parse(stored) : [];
  }

  // Export data
  async exportData(): Promise<BackendResponse<string>> {
    const backendAvailable = await this.checkBackend();
    
    if (backendAvailable) {
      try {
        const response = await fetch(`${this.baseUrl}/export`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          return { success: true, data: data.downloadUrl };
        } else {
          const error = await response.text();
          return { success: false, error };
        }
      } catch (error) {
        console.error('Backend export failed:', error);
        this.useLocalStorage = true;
      }
    }

    // localStorage fallback
    if (this.useLocalStorage) {
      try {
        const properties = this.getStoredProperties();
        const csvContent = this.convertToCSV(properties);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        return { success: true, data: url, message: 'Data exported as CSV' };
      } catch (error) {
        return { success: false, error: 'Failed to export data' };
      }
    }

    return { success: false, error: 'No storage method available' };
  }

  private convertToCSV(properties: BackendProperty[]): string {
    const headers = ['ID', 'Address', 'City', 'State', 'Zip', 'Property Type', 'Market Value', 'Acreage', 'Description', 'Owner', 'Status', 'Submitted At'];
    const rows = properties.map(p => [
      p.id,
      p.address,
      p.city,
      p.state,
      p.zipCode,
      p.propertyType,
      p.marketValue,
      p.acreage || '',
      p.description || '',
      p.owner || '',
      p.status,
      p.submittedAt
    ]);

    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
  }
}

// Export singleton instance
export const backendService = new BackendService(); 