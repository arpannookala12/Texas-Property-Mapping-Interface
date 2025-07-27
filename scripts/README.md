# Building Footprints Extraction

This directory contains scripts to extract Travis County building footprints from the large Texas.geojson file.

## Files

- `extract_travis_buildings.py` - Python script to extract Travis County buildings
- `run_extraction.sh` - Shell script to run the extraction process
- `README.md` - This file

## How it works

1. **Input**: 2.8GB `Texas.geojson` file (Microsoft Global ML Building Footprints)
2. **Processing**: Python script filters buildings within Travis County bounds
3. **Output**: Smaller `travis-buildings.json` file with only Travis County buildings

## Travis County Bounds

```python
TRAVIS_BOUNDS = {
    'north': 30.8,   # North latitude
    'south': 30.0,   # South latitude  
    'east': -97.4,   # East longitude
    'west': -98.2    # West longitude
}
```

## Usage

### Option 1: Run the shell script
```bash
./scripts/run_extraction.sh
```

### Option 2: Run Python directly
```bash
python3 scripts/extract_travis_buildings.py
```

## Requirements

- Python 3.6+
- `Texas.geojson` file in `public/data/` directory

## Output

The script will create:
- `public/data/travis-buildings.json` - Extracted Travis County buildings
- Console output showing progress and statistics

## Performance

- **Input**: 2.8GB Texas.geojson file
- **Processing**: Line-by-line parsing to handle large file
- **Output**: ~1-10MB travis-buildings.json (depending on building density)
- **Time**: 5-15 minutes depending on system performance

## Integration

After extraction, the React app will automatically load the extracted buildings when you:
1. Go to the "Buildings" page
2. Select "Building Footprints" from the layer dropdown
3. The buildings will appear as interactive polygons on the map

## Troubleshooting

### No buildings found
- Check that `Texas.geojson` exists in `public/data/`
- Verify the file is a valid GeoJSON FeatureCollection
- Check Travis County bounds are correct

### Memory errors
- The script uses line-by-line processing to avoid memory issues
- If still having problems, reduce `max_buildings` in the script

### File not found
- Ensure `Texas.geojson` is in the correct location
- Check file permissions 