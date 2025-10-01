import React, { createContext, useContext, ReactNode } from "react";
import { LoadScript } from "@react-google-maps/api";

// Google Maps libraries we need
const libraries: ("places" | "geometry" | "drawing")[] = ["places", "geometry"];

interface GoogleMapsContextType {
  isLoaded: boolean;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
});

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({
  children,
}) => {
  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  if (!googleMapsApiKey) {
    console.error(
      "Google Maps API key not found. Please set REACT_APP_GOOGLE_MAPS_API_KEY in your .env file"
    );
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center text-red-600">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="font-medium">Google Maps API Key Required</p>
          <p className="text-sm">
            Please configure REACT_APP_GOOGLE_MAPS_API_KEY
          </p>
        </div>
      </div>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={googleMapsApiKey}
      libraries={libraries}
      loadingElement={
        <div className="flex items-center justify-center h-64 bg-gray-50">
          <div className="text-center text-gray-600">
            <div className="text-4xl mb-2">🗺️</div>
            <p className="font-medium">Loading Google Maps...</p>
          </div>
        </div>
      }
    >
      <GoogleMapsContext.Provider value={{ isLoaded: true }}>
        {children}
      </GoogleMapsContext.Provider>
    </LoadScript>
  );
};

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error("useGoogleMaps must be used within a GoogleMapsProvider");
  }
  return context;
};
