import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ActiveBookingData {
  id: string;
  status: string;
  pickupAddress: string;
  dropAddress: string;
  vehicleType: string;
  estimatedFare: number;
  // Navigation params for LiveTracking
  pickup: string;
  drop: string;
  pickupCoords?: { latitude: number; longitude: number };
  dropCoords?: { latitude: number; longitude: number };
  paymentMethod: 'cash' | 'online';
  paidBy?: 'sender' | 'receiver';
}

interface BookingStore {
  activeBooking: ActiveBookingData | null;
  setActiveBooking: (data: ActiveBookingData) => void;
  updateActiveBookingId: (id: string) => void;
  updateActiveBookingStatus: (status: string) => void;
  clearActiveBooking: () => void;
}

export const useBookingStore = create<BookingStore>()(
  persist(
    (set) => ({
      activeBooking: null,
      setActiveBooking: (data) => set({ activeBooking: data }),
      updateActiveBookingId: (id) =>
        set((state) =>
          state.activeBooking ? { activeBooking: { ...state.activeBooking, id } } : state,
        ),
      updateActiveBookingStatus: (status) =>
        set((state) =>
          state.activeBooking ? { activeBooking: { ...state.activeBooking, status } } : state,
        ),
      clearActiveBooking: () => set({ activeBooking: null }),
    }),
    {
      name: 'zipto-booking-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
