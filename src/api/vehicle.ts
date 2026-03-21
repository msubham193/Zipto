import client from './client';

// Type definitions for vehicle API
export interface VehicleType {
  type: string;           // e.g., "bike", "tata_ace"
  name: string;          // Display name
  capacity_range: string; // e.g., "10-50 kg"
  base_fare: number;      // Base price
}

export interface VehicleTypesResponse {
  success: boolean;
  data: VehicleType[];
  timestamp: string;
}

// Fare estimation types
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  address: string;
}

export interface FareEstimateRequest {
  pickup_location: LocationCoordinates;
  drop_location: LocationCoordinates;
  vehicle_type: string;
  number_of_helpers: number;
  extra_stops?: number;
}

export interface VehiclePricing {
  id: string;
  vehicle_type: string;
  base_fare: string;
  base_distance_km: string;
  per_km_rate: string;
  per_minute_rate: string;
  minimum_fare: string;
  surge_multiplier: string;
  free_waiting_minutes: number;
  waiting_charge_per_minute: string;
  capacity_min: number;
  capacity_max: number;
  best_for: string | null;
  night_surcharge_percent: string;
  multi_stop_fee: string;
  helper_charge_per_person: string;
  helper_available: boolean;
  commission_percent: string;
  city: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FareEstimateResponse {
  success: boolean;
  data: {
    distance: number;
    duration: number;
    estimated_fare: number;
    breakdown: {
      base_fare: number;
      distance_charge: number;
      time_charge: number;
      surge_multiplier: number;
      minimum_fare: number;
      platform_fee?: number;
      platform_fee_gst?: number;
      multi_stop_charge?: number;
      subtotal?: number;
    };
  };
  timestamp: string;
}

// Booking creation types
export interface CreateBookingRequest {
  name: string;
  mobile_number: string;
  city: string;
  service_category: string;
  pickup_location: LocationCoordinates;
  drop_location: LocationCoordinates;
  vehicle_type: string;
  booking_type: 'instant' | 'scheduled';
  scheduled_time?: string;
  number_of_helpers?: number;
  receiver_name?: string;
  receiver_phone?: string;
  alternative_phone?: string;
}

export interface CreateBookingResponse {
  success: boolean;
  data: {
    booking_id: string;
    [key: string]: any;
  };
  message?: string;
}

// Cash payment types
export interface CashPaymentRequest {
  booking_id: string;
  amount: number;
}

export interface CashPaymentResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// Online payment types
export interface CreateOrderRequest {
  booking_id: string;
  amount: number;
}

export interface CreateOrderResponse {
  success: boolean;
  data: {
    order_id: string;
    amount: number;
    currency: string;
    key: string;
    [key: string]: any;
  };
  message?: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  booking_id: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// Booking details types (matches actual API response)
export interface BookingDetails {
  id: string;
  customer_id: string;
  driver_id: string | null;
  vehicle_id: string | null;
  name: string;
  mobile_number: string;
  city: string;
  booking_type: string;
  pickup_location: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  pickup_address: string;
  drop_location: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  drop_address: string;
  distance: string;
  duration: number;
  estimated_fare: string;
  final_fare: string | null;
  status: string;
  scheduled_time: string | null;
  booking_time: string;
  acceptance_time: string | null;
  start_time: string | null;
  completion_time: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  driver: {
    id: string;
    name: string;
    phone: string;
    vehicle_number?: string;
    rating?: number;
  } | null;
  vehicle: any | null;
  otp?: string;
  delivery_otp?: string;
  receiver_name?: string;
  receiver_phone?: string;
  alternative_phone?: string;
  otp_verified?: boolean;
  vehicle_type?: string;
  payments?: {
    id: string;
    amount: string;
    payment_method: string;
    payment_status: string;
    transaction_id: string | null;
    created_at: string;
  }[];
  [key: string]: any;
}

export interface BookingDetailsResponse {
  success: boolean;
  data: BookingDetails;
  message?: string;
}

export interface BookingHistoryResponse {
  success: boolean;
  data: {
    bookings: BookingDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  timestamp?: string;
}

export interface CancelBookingRequest {
  reason: string;
}

export interface CancelBookingResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// Coins types
export interface CoinsBalanceResponse {
  coins: number;
  rupee_value: number;
  rate: string;
}

export interface CoinTransaction {
  id: string;
  user_id: string;
  coins: number;
  type: string;
  booking_id: string;
  description: string;
  distance_km: number;
  order_amount: number;
  multiplier: number;
  created_at: string;
}

export interface CoinsHistoryResponse {
  transactions: CoinTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransferToWalletRequest {
  coins: number;
}

export interface TransferToWalletResponse {
  success: boolean;
  message: string;
  data?: {
    coins_deducted: number;
    rupee_value: number;
    remaining_coins: number;
  };
}

// Rating types
export interface SubmitRatingRequest {
  booking_id: string;
  rating: number;
  comment?: string;
}

export interface RatingData {
  id: string;
  booking_id: string;
  customer_id: string;
  driver_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface SubmitRatingResponse {
  success: boolean;
  data: RatingData;
  message?: string;
}

export interface GetRatingResponse {
  success: boolean;
  data: RatingData | null;
  message?: string;
}

// Vehicle API service
export const vehicleApi = {
  /**
   * Fetch all available vehicle types
   * @returns Promise with vehicle types data
   */
  getVehicleTypes: async (): Promise<VehicleTypesResponse> => {
    const response = await client.get<VehicleTypesResponse>('/vehicle/types');
    return response.data;
  },

  getVehiclePricing: async (): Promise<VehiclePricing[]> => {
    const response = await client.get<VehiclePricing[]>('/booking/vehicles/pricing');
    return response.data;
  },

  /**
   * Estimate fare for a booking
   * @param request Fare estimation request data
   * @returns Promise with fare estimate data
   */
  estimateFare: async (request: FareEstimateRequest): Promise<FareEstimateResponse> => {
    const response = await client.post<FareEstimateResponse>(
      '/booking/estimate-fare',
      request
    );
    return response.data;
  },

  createBooking: async (request: CreateBookingRequest): Promise<CreateBookingResponse> => {
    const response = await client.post<CreateBookingResponse>(
      '/booking/create',
      request
    );
    return response.data;
  },

  recordCashPayment: async (request: CashPaymentRequest): Promise<CashPaymentResponse> => {
    const response = await client.post<CashPaymentResponse>(
      '/payment/cash',
      request
    );
    return response.data;
  },

  createPaymentOrder: async (request: CreateOrderRequest): Promise<CreateOrderResponse> => {
    const response = await client.post<CreateOrderResponse>(
      '/payment/create-order',
      request
    );
    return response.data;
  },

  verifyPayment: async (request: VerifyPaymentRequest): Promise<VerifyPaymentResponse> => {
    const response = await client.post<VerifyPaymentResponse>(
      '/payment/verify',
      request
    );
    return response.data;
  },

  getOfferStatus: async (offerId: string): Promise<{ success: boolean; data: { status: 'searching' | 'accepted' | 'expired'; booking_id?: string } }> => {
    const response = await client.get(`/booking/offer/${offerId}/status`);
    return response.data;
  },

  getBookingDetails: async (bookingId: string): Promise<BookingDetailsResponse> => {
    const response = await client.get<BookingDetailsResponse>(
      `/booking/${bookingId}`
    );
    return response.data;
  },

  getCustomerActiveBooking: async (): Promise<any> => {
    const response = await client.get('/booking/customer/active');
    return response.data?.data ?? response.data;
  },

  getCustomerHistory: async (page: number = 1, limit: number = 20): Promise<BookingHistoryResponse> => {
    const response = await client.get<BookingHistoryResponse>(
      `/booking/customer/history?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  cancelBooking: async (bookingId: string, reason: string): Promise<CancelBookingResponse> => {
    const response = await client.put<CancelBookingResponse>(
      `/booking/${bookingId}/cancel`,
      { reason }
    );
    return response.data;
  },

  getCoinsBalance: async (): Promise<CoinsBalanceResponse> => {
    const response = await client.get('/coins/balance');
    return response.data?.data ?? response.data;
  },

  getCoinsHistory: async (page: number = 1, limit: number = 10): Promise<CoinsHistoryResponse> => {
    const response = await client.get(
      `/coins/history?page=${page}&limit=${limit}`
    );
    return response.data?.data ?? response.data;
  },

  transferToWallet: async (request: TransferToWalletRequest): Promise<TransferToWalletResponse> => {
    const response = await client.post(
      '/coins/transfer-to-wallet',
      request
    );
    return response.data?.data ?? response.data;
  },

  submitRating: async (request: SubmitRatingRequest): Promise<SubmitRatingResponse> => {
    const response = await client.post('/rating/submit', request);
    return response.data?.data ?? response.data;
  },

  getRatingByBooking: async (bookingId: string): Promise<GetRatingResponse> => {
    const response = await client.get(`/rating/booking/${bookingId}`);
    return response.data?.data ?? response.data;
  },
};

