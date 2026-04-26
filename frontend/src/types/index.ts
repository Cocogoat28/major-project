export interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  recurringDays?: number[];
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'accepted' | 'rejected';
  price: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  timestamp: Date;
  status: 'completed' | 'pending';
}

export interface Provider {
  id: string;
  name: string;
  email: string;
  phone: string;
  isVerified: boolean;
  isOnline: boolean;
  walletBalance: number;
}
// New types for dashboard stats
export interface MonthlyEarning {
  _id: { year: number; month: number };
  total: number;
}

export interface BookingStats {
  pending: number;
  accepted: number;
  completed: number;
  cancelled: number;
  total: number;
}

export interface SpaceStats {
  approved: number;
  pending: number;
  inactive: number;
  total: number;
}

export interface ProviderStats {
  totalEarnings: number;
  totalSpaces: number;
  bookingStats: BookingStats;
  monthlyEarnings: MonthlyEarning[];
  spaceStats: SpaceStats;
}
