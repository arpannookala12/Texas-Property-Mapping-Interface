#!/bin/bash

# Script to extract Travis County buildings from Texas.geojson

echo "🚀 Starting Travis County building extraction..."
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 and try again."
    exit 1
fi

# Check if the Texas.geojson file exists
if [ ! -f "public/data/Texas.geojson" ]; then
    echo "❌ Texas.geojson file not found in public/data/"
    echo "Please ensure the file is in the correct location."
    exit 1
fi

echo "📁 Input file: public/data/Texas.geojson"
echo "📁 Output file: public/data/travis-buildings.json"
echo ""

# Run the Python script
python3 scripts/extract_travis_buildings.py

echo ""
echo "✅ Extraction complete!"
echo ""
echo "Next steps:"
echo "1. Check the generated travis-buildings.json file"
echo "2. Test the buildings layer in your React app"
echo "3. Run 'npm run dev' and go to the Buildings page" 