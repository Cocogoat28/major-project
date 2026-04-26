// carfive/test_park/frontend/src/components/dashboard/SlotManagementModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Layers3, Plus, Minus, Loader2 } from 'lucide-react';
import parkingService from '../../services/parking.service';

interface Location {
  _id: string;
  title: string;
  totalSpots: number;
  availableSpots: number;
}

interface SlotManagementModalProps {
  space: Location;
  onClose: () => void;
  onUpdate: (updatedSpace: Location) => void;
}

const SlotManagementModal: React.FC<SlotManagementModalProps> = ({ space, onClose, onUpdate }) => {
  const [newTotalSpots, setNewTotalSpots] = useState(space.totalSpots);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNewTotalSpots(space.totalSpots);
  }, [space.totalSpots]);

  const handleUpdateSlots = async () => {
    if (newTotalSpots < 1) {
      setError('Total slots must be at least 1.');
      return;
    }

    if (newTotalSpots === space.totalSpots) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await parkingService.updateSlots(space._id, newTotalSpots);
      
      // The backend should return the updated parking space object
      const updatedSpace = response.parkingSpace || response;

      onUpdate({
        _id: updatedSpace._id,
        title: updatedSpace.title,
        totalSpots: updatedSpace.totalSpots,
        availableSpots: updatedSpace.availableSpots,
      });
      onClose();
    } catch (err) {
      const errorMessage = (err as any)?.response?.data?.message || 'Failed to update slots. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const bookedSpots = space.totalSpots - space.availableSpots;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-6 w-6" />
        </button>

        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
          <Layers3 className="h-5 w-5 mr-2" />
          Manage Parking Slots
        </h3>

        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Adjust the total number of parking slots available for <span className="font-semibold">{space.title}</span>.
          </p>

          <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Total Slots:</span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{space.totalSpots}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Currently Booked:</span>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">{bookedSpots}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              You cannot set the total slots below the number of currently booked slots ({bookedSpots}).
            </p>
          </div>

          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setNewTotalSpots(prev => Math.max(bookedSpots, prev - 1))}
              disabled={loading || newTotalSpots <= bookedSpots}
              className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400 transition-colors"
            >
              <Minus className="h-6 w-6" />
            </button>
            <input
              type="number"
              value={newTotalSpots}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setNewTotalSpots(isNaN(value) ? 0 : value);
                setError(null);
              }}
              min={bookedSpots}
              className="w-24 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={() => setNewTotalSpots(prev => prev + 1)}
              disabled={loading}
              className="p-3 rounded-full bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400 transition-colors"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            onClick={handleUpdateSlots}
            disabled={loading || newTotalSpots === space.totalSpots || newTotalSpots < bookedSpots}
            className="w-full flex items-center justify-center px-4 py-2 rounded-lg text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlotManagementModal;