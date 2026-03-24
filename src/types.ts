export type UserRole = 'super_admin' | 'branch_manager' | 'field_officer' | 'member';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  branchId?: string;
  status: 'active' | 'inactive';
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  code: string;
  createdAt: string;
}

export interface Member {
  id: string;
  memberId: string;
  name: string;
  phone: string;
  nid: string;
  address: string;
  photoUrl?: string;
  nomineeName: string;
  nomineeRelation: string;
  branchId: string;
  status: 'pending' | 'active' | 'rejected';
  createdAt: string;
  uid?: string; // Linked Firebase Auth UID
}

export interface Loan {
  id: string;
  memberId: string;
  amount: number;
  serviceCharge: number;
  totalPayable: number;
  installmentType: 'daily' | 'weekly' | 'monthly';
  installments: number;
  paidAmount: number;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  branchId: string;
  createdAt: string;
}

export interface Savings {
  id: string;
  memberId: string;
  type: 'general' | 'dps' | 'fdr';
  balance: number;
  monthlyInstallment?: number;
  term?: number;
  interestRate: number;
  branchId: string;
}

export interface Transaction {
  id: string;
  memberId: string;
  type: 'deposit' | 'withdrawal' | 'installment' | 'fee';
  amount: number;
  method: 'cash' | 'online';
  branchId: string;
  fieldOfficerId?: string;
  timestamp: string;
}

export interface GlobalSettings {
  smsAppKey: string;
  smsAuthKey: string;
  paymentMerchantId: string;
  lateFeeRate: number;
  sandboxMode: boolean;
  autoSmsReminders: boolean;
  reminderDays: number;
}
