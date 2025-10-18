import React, { useState, useEffect } from "react";
import { Vehicle } from "../../utils/vehicleUtils";
import { ResourceSuggestion } from "../../utils/resourceMatrix";

interface VehicleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (selectedVehicles: Vehicle[]) => void;
  incidentLocation: {
    lat: number;
    lng: number;
  };
  incidentId: string;
  suggestions: ResourceSuggestion[];
}

const VehicleSelectionModal: React.FC<VehicleSelectionModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  incidentLocation,
  incidentId,
  suggestions,
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available vehicles
  useEffect(() => {
    if (!isOpen) return;

    const fetchVehicles = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/vehicles", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          // Filter only available vehicles
          const availableVehicles = result.data.filter(
            (v: Vehicle) => v.status.currentStatus === "available"
          );
          setVehicles(availableVehicles);
        } else {
          throw new Error("Failed to fetch vehicles");
        }
      } catch (err) {
        console.error("Error fetching vehicles:", err);
        setError("Failed to load vehicles. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [isOpen]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate ETA based on distance (assuming 40 km/h average speed)
  const calculateETA = (distance: number): number => {
    return Math.round((distance / 40) * 60); // minutes
  };

  // Get vehicle distance and ETA
  const getVehicleDetails = (vehicle: Vehicle) => {
    if (
      vehicle.status?.currentLocation?.coordinates &&
      vehicle.status.currentLocation.coordinates.length === 2
    ) {
      const [vLng, vLat] = vehicle.status.currentLocation.coordinates;
      const distance = calculateDistance(
        incidentLocation.lat,
        incidentLocation.lng,
        vLat,
        vLng
      );
      const eta = calculateETA(distance);
      return { distance: distance.toFixed(1), eta };
    }
    return { distance: "N/A", eta: 0 };
  };

  // Check if vehicle type matches suggestions
  const isRecommended = (vehicleType: string): boolean => {
    return suggestions.some(
      (s) => s.vehicleType.toLowerCase() === vehicleType.toLowerCase()
    );
  };

  // Get priority level for vehicle
  const getPriority = (vehicleType: string): number => {
    const suggestion = suggestions.find(
      (s) => s.vehicleType.toLowerCase() === vehicleType.toLowerCase()
    );
    return suggestion?.priority || 999;
  };

  // Toggle vehicle selection
  const toggleVehicle = (vehicleId: string) => {
    const newSelection = new Set(selectedVehicles);
    if (newSelection.has(vehicleId)) {
      newSelection.delete(vehicleId);
    } else {
      newSelection.add(vehicleId);
    }
    setSelectedVehicles(newSelection);
  };

  // Handle assignment
  const handleAssign = () => {
    const selected = vehicles.filter((v) => selectedVehicles.has(v._id));
    onAssign(selected);
    setSelectedVehicles(new Set());
  };

  // Sort vehicles: recommended first, then by distance
  const sortedVehicles = [...vehicles].sort((a, b) => {
    const aRecommended = isRecommended(a.registration.vehicleType);
    const bRecommended = isRecommended(b.registration.vehicleType);

    if (aRecommended && !bRecommended) return -1;
    if (!aRecommended && bRecommended) return 1;

    // If both recommended or both not, sort by priority then distance
    const aPriority = getPriority(a.registration.vehicleType);
    const bPriority = getPriority(b.registration.vehicleType);

    if (aPriority !== bPriority) return aPriority - bPriority;

    const aDetails = getVehicleDetails(a);
    const bDetails = getVehicleDetails(b);

    return parseFloat(aDetails.distance) - parseFloat(bDetails.distance);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Select Vehicle(s) to Assign
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose available vehicles for incident {incidentId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading vehicles...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : vehicles.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              No available vehicles found. All vehicles may be assigned or out
              of service.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedVehicles.map((vehicle) => {
                const details = getVehicleDetails(vehicle);
                const recommended = isRecommended(
                  vehicle.registration.vehicleType
                );
                const isSelected = selectedVehicles.has(vehicle._id);

                return (
                  <div
                    key={vehicle._id}
                    onClick={() => toggleVehicle(vehicle._id)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50"
                        : recommended
                        ? "border-green-300 bg-green-50 hover:border-green-400"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Checkbox */}
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>

                        {/* Vehicle Info */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {vehicle.registration.plateNumber}
                            </h3>
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                              {vehicle.registration.vehicleType}
                            </span>
                            {recommended && (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                                ✓ Recommended
                              </span>
                            )}
                          </div>

                          {/* Crew Info */}
                          {vehicle.assignment?.crew &&
                            vehicle.assignment.crew.length > 0 && (
                              <div className="text-sm text-gray-600 mb-2">
                                <strong>Crew:</strong>{" "}
                                {vehicle.assignment.crew.length} member(s)
                                assigned
                              </div>
                            )}

                          {/* Location & ETA */}
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center text-gray-600">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span>{details.distance} km away</span>
                            </div>
                            <div className="flex items-center text-blue-600 font-medium">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>ETA: ~{details.eta} min</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedVehicles.size > 0 ? (
              <span className="font-medium text-blue-600">
                {selectedVehicles.size} vehicle(s) selected
              </span>
            ) : (
              <span>Select at least one vehicle to continue</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={selectedVehicles.size === 0}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedVehicles.size > 0
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Assign to Incident
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleSelectionModal;
