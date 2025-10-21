import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

interface MapLocationPickerProps {
  onLocationSelect: (location: {
    address: string;
    city: string;
    coordinates: [number, number];
    formattedAddress: string;
  }) => void;
  className?: string;
}

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ onLocationSelect, className = '' }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_KEY = 'AIzaSyCImZPnbKVvv5xl71BQ6tagdhgUz4FbC5g';

  useEffect(() => {
    const initializeMap = () => {
      if (mapRef.current) {
        try {
          // Center on Colombo, Sri Lanka
          const colombo = { lat: 6.9271, lng: 79.8612 };
          
          const newMap = new window.google.maps.Map(mapRef.current, {
            center: colombo,
            zoom: 13,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
          });

          setMap(newMap);

          // Add click listener to map
          newMap.addListener('click', (event: any) => {
            if (event.latLng) {
              handleMapClick(event.latLng, newMap);
            }
          });

          setIsLoading(false);
        } catch (err) {
          console.error('Error initializing map:', err);
          setError('Failed to initialize map');
          setIsLoading(false);
        }
      }
    };

    const initMap = async () => {
      try {
        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
          initializeMap();
          return;
        }

        // Check if script already exists
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
          const checkLoaded = () => {
            if (window.google && window.google.maps) {
              initializeMap();
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
          return;
        }

        // Create and load script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          const checkLoaded = () => {
            if (window.google && window.google.maps) {
              initializeMap();
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
        };

        script.onerror = () => {
          console.error('Failed to load Google Maps API');
          setError('Failed to load Google Maps');
          setIsLoading(false);
        };

        document.head.appendChild(script);
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError('Failed to load Google Maps');
        setIsLoading(false);
      }
    };

    initMap();
  }, [API_KEY]);

  const handleMapClick = async (latLng: any, mapInstance: any) => {
    // Remove existing marker
    if (marker) {
      marker.setMap(null);
    }

    // Create new marker
    const newMarker = new window.google.maps.Marker({
      position: latLng,
      map: mapInstance,
      title: 'Incident Location',
      animation: window.google.maps.Animation.DROP,
    });
    setMarker(newMarker);

    // Reverse geocode to get address
    const geocoder = new window.google.maps.Geocoder();
    try {
      const response = await geocoder.geocode({ location: latLng });
      
      if (response.results && response.results[0]) {
        const result = response.results[0];
        const addressComponents = result.address_components;
        
        let city = '';
        let streetAddress = '';
        
        // Extract components
        addressComponents.forEach((component: any) => {
          const types = component.types;
          
          if (types.includes('locality') || types.includes('administrative_area_level_2')) {
            city = component.long_name;
          }
          
          if (types.includes('street_number') || types.includes('route')) {
            streetAddress += component.long_name + ' ';
          }
        });

        // If no street address found, use the formatted address up to the first comma
        if (!streetAddress.trim()) {
          streetAddress = result.formatted_address.split(',')[0];
        }

        const locationData = {
          address: streetAddress.trim() || 'Selected Location',
          city: city || 'Unknown City',
          coordinates: [latLng.lng(), latLng.lat()] as [number, number],
          formattedAddress: result.formatted_address,
        };

        onLocationSelect(locationData);
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
      // Still provide coordinates even if geocoding fails
      onLocationSelect({
        address: 'Selected Location',
        city: 'Unknown City',
        coordinates: [latLng.lng(), latLng.lat()],
        formattedAddress: `${latLng.lat().toFixed(6)}, ${latLng.lng().toFixed(6)}`,
      });
    }
  };

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
        <div className="flex">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Map Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {isLoading && (
        <div className="flex items-center justify-center h-96 bg-gray-100 rounded-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading map...</p>
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        className={`w-full h-96 rounded-md border border-gray-300 ${isLoading ? 'hidden' : ''}`}
      />
      {!isLoading && (
        <p className="text-xs text-gray-500 mt-2">
          💡 Click anywhere on the map to select the incident location
        </p>
      )}
    </div>
  );
};

export default MapLocationPicker;