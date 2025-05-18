export interface Client {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'standard' | 'premium';
  status: 'active' | 'expired' | 'pending';
  startDate: string;
  endDate: string;
  company?: string;
  businessNumber?: string;
  phone?: string;
  address?: string;
  paymentMethod?: string;
  billingCycle?: string;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  paymentHistory: Payment[];
  businessPlans: BusinessPlan[];
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: 'success' | 'failed' | 'refunded';
}

export interface BusinessPlan {
  id: string;
  title: string;
  type: string;
  createDate: string;
  lastEditDate: string;
}