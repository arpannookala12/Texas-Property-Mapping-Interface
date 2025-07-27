#!/usr/bin/env python3
"""
Extract Travis County building footprints from Texas.geojson
This script processes the large 2.8GB file and extracts only Travis County buildings.
"""

import json
import sys
import os
from pathlib import Path

# Travis County bounding box
TRAVIS_BOUNDS = {
    'north': 30.8,
    'south': 30.0,
    'east': -97.4,
    'west': -98.2
}

def is_in_travis_county(feature):
    """Check if a building feature is within Travis County bounds."""
    try:
        if 'geometry' not in feature or 'coordinates' not in feature['geometry']:
            return False
        
        geometry = feature['geometry']
        
        # Handle different geometry types
        if geometry['type'] == 'Polygon':
            coordinates = geometry['coordinates'][0]  # First ring
        elif geometry['type'] == 'MultiPolygon':
            coordinates = []
            for polygon in geometry['coordinates']:
                coordinates.extend(polygon[0])  # All rings from all polygons
        else:
            return False
        
        # Calculate center point
        if not coordinates:
            return False
            
        center_lng = sum(coord[0] for coord in coordinates) / len(coordinates)
        center_lat = sum(coord[1] for coord in coordinates) / len(coordinates)
        
        # Check if center is in Travis County bounds
        return (TRAVIS_BOUNDS['south'] <= center_lat <= TRAVIS_BOUNDS['north'] and
                TRAVIS_BOUNDS['west'] <= center_lng <= TRAVIS_BOUNDS['east'])
                
    except Exception as e:
        print(f"Error checking bounds: {e}")
        return False

def process_texas_geojson(input_path, output_path, max_buildings=5000):
    """Process the Texas.geojson file and extract Travis County buildings."""
    
    print(f"Processing {input_path}...")
    print(f"Travis County bounds: {TRAVIS_BOUNDS}")
    print(f"Max buildings to extract: {max_buildings}")
    
    travis_buildings = []
    total_features = 0
    found_count = 0
    
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            # Read the opening of the GeoJSON file
            line = f.readline()
            if not line.strip().startswith('{"type":"FeatureCollection"'):
                print("Error: File doesn't appear to be a valid GeoJSON FeatureCollection")
                return
            
            # Skip to the features array
            while line and '"features"' not in line:
                line = f.readline()
            
            if not line:
                print("Error: Could not find features array")
                return
            
            # Process features one by one
            in_features = False
            feature_buffer = ""
            brace_count = 0
            
            for line in f:
                line = line.strip()
                
                if '"features"' in line:
                    in_features = True
                    continue
                
                if in_features:
                    if line.startswith('['):
                        continue
                    elif line.startswith(']'):
                        break
                    elif line.startswith('{'):
                        feature_buffer = line
                        brace_count = line.count('{') - line.count('}')
                    else:
                        feature_buffer += line
                        brace_count += line.count('{') - line.count('}')
                    
                    # Complete feature found
                    if brace_count == 0 and feature_buffer:
                        try:
                            # Remove trailing comma if present
                            if feature_buffer.endswith(','):
                                feature_buffer = feature_buffer[:-1]
                            
                            feature = json.loads(feature_buffer)
                            total_features += 1
                            
                            if is_in_travis_county(feature):
                                travis_buildings.append(feature)
                                found_count += 1
                                
                                if found_count % 100 == 0:
                                    print(f"Found {found_count} Travis County buildings...")
                                
                                if found_count >= max_buildings:
                                    print(f"Reached max buildings limit ({max_buildings})")
                                    break
                            
                        except json.JSONDecodeError as e:
                            print(f"Error parsing feature: {e}")
                            continue
                        
                        feature_buffer = ""
    
    except FileNotFoundError:
        print(f"Error: File {input_path} not found")
        return
    except Exception as e:
        print(f"Error processing file: {e}")
        return
    
    print(f"\nProcessing complete!")
    print(f"Total features processed: {total_features}")
    print(f"Travis County buildings found: {found_count}")
    
    if found_count == 0:
        print("No Travis County buildings found. Check the bounding box coordinates.")
        return
    
    # Create output GeoJSON
    output_geojson = {
        "type": "FeatureCollection",
        "features": travis_buildings
    }
    
    # Save to output file
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_geojson, f, indent=2)
        
        print(f"Saved {found_count} buildings to {output_path}")
        print(f"File size: {os.path.getsize(output_path) / 1024 / 1024:.2f} MB")
        
    except Exception as e:
        print(f"Error saving output file: {e}")

def main():
    """Main function to run the extraction."""
    
    # File paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    data_dir = project_root / "public" / "data"
    
    input_file = data_dir / "Texas.geojson"
    output_file = data_dir / "travis-buildings.json"
    
    # Check if input file exists
    if not input_file.exists():
        print(f"Error: {input_file} not found")
        print("Please ensure the Texas.geojson file is in the public/data directory")
        return
    
    # Process the file
    process_texas_geojson(input_file, output_file)
    
    print(f"\nNext steps:")
    print(f"1. The extracted buildings are saved to: {output_file}")
    print(f"2. Update the buildingFootprintLoader.ts to use this file")
    print(f"3. Test the buildings layer in your React app")

if __name__ == "__main__":
    main() 