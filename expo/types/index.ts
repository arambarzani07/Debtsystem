export type Currency = 'IQD' | 'USD' | 'EUR';
export type DebtorCategory = 'VIP' | 'Regular' | 'Wholesale';
export type ColorTag = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'pink' | 'cyan';

export interface TransactionHistoryItem {
  id: string;
  action: 'created' | 'edited' | 'deleted';
  date: string;
  previousData?: Partial<Transaction>;
  changes?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'debt' | 'payment';
  currency?: Currency;
  imageUri?: string;
  receiptPhotoUri?: string;
  voiceNoteUri?: string;
  comment?: string;
  isPartialPayment?: boolean;
  partialPaymentOf?: string;
  history?: TransactionHistoryItem[];
  qrCode?: string;
  tags?: string[];
  isLocked?: boolean;
  createdBy?: {
    userId: string;
    userName: string;
    userRole: UserRole;
  };
}

export interface PaymentScheduleItem {
  id: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paidDate?: string;
}

export interface Debtor {
  id: string;
  name: string;
  nameEn?: string;
  phone?: string;
  totalDebt: number;
  transactions: Transaction[];
  createdAt: string;
  notes?: string;
  debtLimit?: number;
  creditLimit?: number;
  imageUri?: string;
  dueDate?: string;
  currency?: Currency;
  category?: DebtorCategory;
  colorTag?: ColorTag;
  interestRate?: number;
  paymentSchedule?: PaymentScheduleItem[];
  userId?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  loyaltyPoints?: number;
  riskScore?: number;
  lastRiskCalculation?: string;
  isLocked?: boolean;
  lockedAt?: string;
  lockedReason?: string;
}

export interface CurrencyRate {
  IQD: number;
  USD: number;
  EUR: number;
}

export type ThemeMode = 'light' | 'dark';

export interface AppSettings {
  theme: ThemeMode;
  currency: Currency;
  hideAmounts: boolean;
  pinEnabled: boolean;
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
  autoBackupEnabled: boolean;
  autoBackupInterval: 'daily' | 'weekly' | 'monthly';
  exchangeRates: CurrencyRate;
  requirePinForDeletion: boolean;
  autoLockOldDebts: boolean;
  autoLockDaysThreshold: number;
  autoLockAmountThreshold: number;
  fontSize?: 'small' | 'medium' | 'large';
  colorfulMode?: boolean;
  showStatsOnHome?: boolean;
  soundEnabled?: boolean;
  hapticEnabled?: boolean;
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat?: '12h' | '24h';
  autoLogout?: boolean;
  performanceMode?: boolean;
  autoBackup?: boolean;
  dataEncryption?: boolean;
  autoSync?: boolean;
  systemAlerts?: boolean;
  autoLockApp?: boolean;
  hideScreenInBackground?: boolean;
  privateMode?: boolean;
  automaticBackupCopy?: boolean;
  smartNotifications?: boolean;
  autoVoiceCall?: boolean;
  autoSMS?: boolean;
  autoWhatsApp?: boolean;
  pdfExport?: boolean;
  excelExport?: boolean;
  smartPaymentSuggestions?: boolean;
  behaviorAnalysis?: boolean;
  paymentCyclePrediction?: boolean;
  quickShortcuts?: boolean;
  easyMode?: boolean;
  autoTransactions?: boolean;
  fastDataDisplay?: boolean;
  shareActivity?: boolean;
}

export type UserRole = 'owner' | 'manager' | 'employee' | 'customer';

export type EmployeePermission = 
  | 'view_debtors'
  | 'add_debtors'
  | 'edit_debtors'
  | 'delete_debtors'
  | 'add_transactions'
  | 'edit_transactions'
  | 'delete_transactions'
  | 'view_reports'
  | 'export_data';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  marketId: string;
  permissions?: EmployeePermission[];
  createdAt: string;
  phone?: string;
  fullName?: string;
  debtorId?: string;
  isActive?: boolean;
}

export interface Market {
  id: string;
  name: string;
  phone: string;
  managerId: string;
  subscriptionEndDate: string;
  isActive: boolean;
  createdAt: string;
  debtorsData?: Debtor[];
}

export interface MarketRequest {
  id: string;
  marketName: string;
  marketPhone: string;
  managerName: string;
  managerPassword: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
}

export type NotificationType = 'subscription' | 'employee_guide' | 'customer_info' | 'reminder' | 'general';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  recipientRole: UserRole;
  recipientId?: string;
  senderRole: UserRole;
  senderId?: string;
  marketId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  senderRole: UserRole;
  recipientRole: UserRole;
  title: string;
  message: string;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  pointsCost: number;
  description: string;
  isActive: boolean;
}

export interface DebtorReward {
  debtorId: string;
  rewardId: string;
  redeemedAt: string;
}

export interface RiskAnalysis {
  debtorId: string;
  riskScore: number;
  predictedDefaultDate?: string;
  factors: {
    paymentHistory: number;
    debtAmount: number;
    interestRate: number;
    timeOverdue: number;
  };
  calculatedAt: string;
}

export type CompanionType = 'cat' | 'dog' | 'bird' | 'fish' | 'dragon' | 'unicorn';
export type CompanionMood = 'very_happy' | 'happy' | 'neutral' | 'sad' | 'very_sad';
export type CompanionStage = 'egg' | 'baby' | 'child' | 'teen' | 'adult' | 'legendary';

export interface CompanionStats {
  health: number;
  happiness: number;
  hunger: number;
  energy: number;
  level: number;
  experience: number;
}

export interface CompanionItem {
  id: string;
  name: string;
  nameKu: string;
  type: 'food' | 'toy' | 'accessory';
  effect: {
    health?: number;
    happiness?: number;
    hunger?: number;
    energy?: number;
  };
  cost: number;
  emoji: string;
}

export interface Companion {
  id: string;
  debtorId: string;
  name: string;
  type: CompanionType;
  stage: CompanionStage;
  stats: CompanionStats;
  mood: CompanionMood;
  createdAt: string;
  lastFed: string;
  lastPlayed: string;
  inventory: string[];
  achievements: string[];
  totalFeedings: number;
  totalPlaytime: number;
  evolutionReady: boolean;
}

export interface CompanionMessage {
  mood: CompanionMood;
  messagesKu: string[];
  messagesEn: string[];
  messagesAr: string[];
}

export interface PaymentPromise {
  id: string;
  debtorId: string;
  debtorName: string;
  amount: number;
  promiseDate: string;
  dueDate: string;
  status: 'pending' | 'kept' | 'broken' | 'cancelled';
  notes?: string;
  createdBy?: string;
  completedDate?: string;
  reminderSent?: boolean;
}

export interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  managerId?: string;
  employeeIds: string[];
  isActive: boolean;
  createdAt: string;
}

export interface CustomerFeedback {
  id: string;
  debtorId: string;
  debtorName: string;
  rating: number;
  comment?: string;
  category: 'service' | 'product' | 'payment' | 'general';
  status: 'pending' | 'responded' | 'resolved';
  response?: string;
  respondedBy?: string;
  respondedAt?: string;
  createdAt: string;
}

export interface PaymentGateway {
  id: string;
  name: string;
  type: 'card' | 'mobile' | 'bank';
  apiKey?: string;
  isActive: boolean;
  commission: number;
  createdAt: string;
}
