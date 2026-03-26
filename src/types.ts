export type UserRole = 'super_admin' | 'branch_manager' | 'field_officer' | 'member';

export interface UserProfile {
  id: string;
  phone: string;
  displayName: string;
  photoUrl?: string;
  role: UserRole;
  branchId?: string;
  status: 'active' | 'inactive';
  kycStatus?: 'pending' | 'verified' | 'rejected';
  aiVerificationResult?: string;
  paymentMethods?: string;
  notificationSettings?: string;
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
  status: 'pending' | 'active' | 'inactive' | 'rejected';
  kycStatus?: 'pending' | 'verified' | 'rejected';
  aiVerificationResult?: string;
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
  applicationDate: string;
  approvalDate?: string;
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
  paymentApiKey: string;
  paymentSecretKey: string;
  paymentBrandKey: string;
  lateFeeRate: number;
  sandboxMode: boolean;
  autoSmsReminders: boolean;
  reminderDays: number;
  otpEnabled?: boolean;
  aiVerificationEnabled?: boolean;
  aiModel?: string;
  aiApiKey?: string;
  welcomeSmsEnabled?: boolean;
  welcomeSmsText?: string;
  otpResendTimer?: number;
  websiteName?: string;
}
