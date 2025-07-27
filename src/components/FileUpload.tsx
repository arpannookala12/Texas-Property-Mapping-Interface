import { Upload, FileText, AlertCircle } from 'lucide-react';
import { processTravisCountyShapefile, convertToProperty } from '../utils/shapefileProcessor';
import type { Property } from '../types';

interface FileUploadProps {
  onDataLoaded: (properties: Property[]) => void;
  onError: (error: string) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onDataLoaded,
  onError,
  isLoading
}) => {
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.shp')) {
      onError('Please select a .shp file');
      return;
    }

    try {
      const parcels = await processTravisCountyShapefile(file);
      const properties = parcels.map(convertToProperty);
      onDataLoaded(properties);
    } catch (error) {
      console.error('Error processing file:', error);
      onError('Error processing shapefile. Please check the file format.');
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2" />
        Load Travis County Data
      </h3>
      
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
          <input
            type="file"
            accept=".shp"
            onChange={handleFileUpload}
            className="hidden"
            id="shapefile-upload"
            disabled={isLoading}
          />
          <label
            htmlFor="shapefile-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">
              {isLoading ? 'Processing...' : 'Click to upload Travis County shapefile (.shp)'}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              Select the main .shp file from your shapefile collection
            </span>
          </label>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Shapefile Requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Upload the main .shp file from your shapefile collection</li>
                <li>Make sure all related files (.dbf, .shx, .prj) are in the same folder</li>
                <li>The file should contain Travis County parcel boundary data</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 