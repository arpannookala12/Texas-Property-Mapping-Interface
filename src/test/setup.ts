import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Mapbox GL JS
vi.mock('mapbox-gl', () => ({
  default: vi.fn().mockImplementation(() => ({
    addControl: vi.fn(),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    removeSource: vi.fn(),
    getLayer: vi.fn(),
    getSource: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    easeTo: vi.fn(),
    flyTo: vi.fn(),
    getCenter: vi.fn(() => ({ lng: -97.7431, lat: 30.2672 })),
    getZoom: vi.fn(() => 10),
    getBearing: vi.fn(() => 0),
    getPitch: vi.fn(() => 0),
    isStyleLoaded: vi.fn(() => true),
    getCanvas: vi.fn(() => ({ style: { cursor: '' } })),
    remove: vi.fn()
  })),
  Popup: vi.fn().mockImplementation(() => ({
    setLngLat: vi.fn().mockReturnThis(),
    setHTML: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn()
  })),
  NavigationControl: vi.fn(),
  FullscreenControl: vi.fn(),
  GeolocateControl: vi.fn()
}));

// Mock environment variables
vi.mock('import.meta.env', () => ({
  VITE_MAPBOX_ACCESS_TOKEN: 'test-token'
}));

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})); 