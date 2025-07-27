import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';

interface AddressFilterProps {
  onSearch: (address: string) => void;
  onClear: () => void;
}

export const AddressFilter: React.FC<AddressFilterProps> = ({
  onSearch,
  onClear
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    onClear();
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <MapPin className="w-5 h-5 mr-2" />
        Address Filter
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search by address..."
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Clear
          </button>
        </div>
      </form>
      
      <div className="mt-3 text-sm text-gray-600">
        <p>Search for properties by address in Texas.</p>
        <p className="mt-1">Examples: "Austin, TX", "Houston", "123 Main St"</p>
      </div>
    </div>
  );
}; 