# وردەکاری تەکنیکی - سیستەمی بەڕێوەبردنی قەرز

## Architecture Overview

### Frontend Architecture
```
React Native (0.79.1)
├── Expo (53.0.4)
├── Expo Router (5.0.3) - File-based routing
├── TypeScript (5.8.3) - Type safety
└── React Query (5.90.5) - State management
```

### State Management Strategy

#### 1. Context Providers (با @nkzw/create-context-hook)
```typescript
// بەکارهێنانی create-context-hook بۆ دروستکردنی Providers

import createContextHook from '@nkzw/create-context-hook';

export const [DebtContext, useDebt] = createContextHook(() => {
  // State و Hooks لێرە
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  
  // Functions
  const addDebtor = useCallback((...) => {...}, []);
  
  return { debtors, addDebtor, ... };
});
```

#### 2. React Query بۆ Server State
```typescript
const usersQuery = useQuery({
  queryKey: ['users'],
  queryFn: async () => {
    const stored = await AsyncStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  },
});
```

#### 3. AsyncStorage بۆ Persistence
```typescript
// خوێندنەوە
const data = await AsyncStorage.getItem('key');

// نووسین
await AsyncStorage.setItem('key', JSON.stringify(data));

// سڕینەوە
await AsyncStorage.removeItem('key');
```

## Data Models

### Core Types

```typescript
// کڕیار
interface Debtor {
  id: string;
  name: string;
  phone?: string;
  totalDebt: number;
  transactions: Transaction[];
  createdAt: string;
  notes?: string;
  debtLimit?: number;
  imageUri?: string;
  dueDate?: string;
  currency?: Currency;
  category?: DebtorCategory;
  colorTag?: ColorTag;
  interestRate?: number;
  paymentSchedule?: PaymentScheduleItem[];
  userId?: string;
}

// مامەڵە
interface Transaction {
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
}

// بەکارهێنەر
interface User {
  id: string;
  username: string;
  password: string;
  role: 'owner' | 'manager' | 'employee' | 'customer';
  marketId: string;
  permissions?: EmployeePermission[];
  createdAt: string;
  phone?: string;
  fullName?: string;
  debtorId?: string;
}

// مارکێت
interface Market {
  id: string;
  name: string;
  phone: string;
  managerId: string;
  subscriptionEndDate: string;
  isActive: boolean;
  createdAt: string;
  debtorsData?: Debtor[];
}
```

## Routing Structure

### File-based Routing لەگەڵ Expo Router

```
app/
├── _layout.tsx              # Root layout
├── index.tsx                # Employee/Manager home
├── login.tsx                # Login screen
├── customer-login.tsx       # Customer login
├── owner-dashboard.tsx      # Owner dashboard
├── customer-dashboard.tsx   # Customer dashboard
├── add-debtor.tsx          # Add new debtor
├── debtor/
│   └��─ [id].tsx            # Debtor details (dynamic route)
├── manage-employees.tsx     # Employee management
├── scan-qr.tsx             # QR scanner
├── customer-qr.tsx         # Customer QR code
├── statistics.tsx          # Statistics & reports
├── reminders.tsx           # Reminders
├── settings.tsx            # Settings
├── transactions.tsx        # All transactions
├── notifications.tsx       # Notifications
├── advanced-search.tsx     # Advanced search
├── advanced-analytics.tsx  # Advanced analytics
├── custom-reports.tsx      # Custom reports
├── history-log.tsx         # History log
└── send-reminders.tsx      # Send reminders
```

## Context Providers

### 1. AuthContext
```typescript
// بەرپرسیار لە:
- Login/Logout
- User management
- Market management
- Permissions
- Role-based access
```

### 2. DebtContext
```typescript
// بەرپرسیار لە:
- Debtor management
- Transaction management
- Payment schedules
- Debt calculations
- Data synchronization
```

### 3. MarketContext
```typescript
// بەرپرسیار لە:
- Market data
- Multi-market support
- Data isolation
- Sync across markets
```

### 4. ThemeContext
```typescript
// بەرپرسیار لە:
- Light/Dark theme
- Color schemes
- Settings (hideAmounts, currency, etc.)
```

### 5. SecurityContext
```typescript
// بەرپرسیار لە:
- PIN code
- Biometric auth
- Lock/Unlock
- Security settings
```

### 6. NotificationContext
```typescript
// بەرپرسیار لە:
- Sending notifications
- Notification templates
- Push notifications
- In-app notifications
```

### 7. LanguageContext
```typescript
// بەرپرسیار لە:
- Language settings
- RTL support
- Translations (future)
```

## Key Features Implementation

### 1. QR Code

#### دروستکردنی QR
```typescript
// لە customer-qr.tsx
<QRCode value={customerId} size={250} />
```

#### سکانی QR
```typescript
// لە scan-qr.tsx
import { CameraView } from 'expo-camera';

<CameraView
  onBarcodeScanned={handleBarCodeScanned}
  barcodeScannerSettings={{
    barcodeTypes: ['qr'],
  }}
/>
```

### 2. Notifications

#### ئاگاداری نێوخۆیی
```typescript
const sendNotification = async (
  type: NotificationType,
  title: string,
  message: string,
  recipientRole: UserRole,
  senderRole: UserRole,
  recipientId?: string,
  senderId?: string,
  marketId?: string
) => {
  const notification: AppNotification = {
    id: Date.now().toString(),
    type,
    title,
    message,
    recipientRole,
    recipientId,
    senderRole,
    senderId,
    marketId,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  
  // Save to storage
  const updated = [...notifications, notification];
  setNotifications(updated);
  syncNotifications(updated);
  
  // Send push notification
  if (Platform.OS !== 'web') {
    await Notifications.scheduleNotificationAsync({
      content: { title, body: message },
      trigger: null,
    });
  }
};
```

#### WhatsApp و SMS
```typescript
// WhatsApp
const whatsappUrl = `whatsapp://send?phone=${phone}&text=${message}`;
await Linking.openURL(whatsappUrl);

// SMS
await SMS.sendSMSAsync([phone], message);
```

### 3. Invoice Generation

```typescript
// لە utils/invoice.ts
export async function generateInvoice(
  debtor: Debtor,
  market: Market | null
): Promise<boolean> {
  const html = `<!DOCTYPE html>...`; // HTML template
  
  if (Platform.OS === 'web') {
    // Web: print directly
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.print();
  } else {
    // Mobile: generate PDF and share
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  }
}
```

### 4. Data Persistence

#### ساختاری Storage
```
AsyncStorage:
├── users_data             # هەموو Users
├── markets_data           # هەموو Markets
├── market_requests_data   # Market Requests
├── current_user           # Current logged in user
├── market_[id]_debtors   # Debtors بۆ هەر Market
├── theme_settings         # Theme settings
├── security_pin           # PIN code
└── notifications          # Notifications
```

#### Sync Strategy
```typescript
// دەستکاری لە Memory
setDebtors(updatedDebtors);

// Sync بۆ Storage
syncData(updatedDebtors);

// Sync function
const { mutate: syncData } = useMutation({
  mutationFn: async (data: Debtor[]) => {
    const key = `market_${currentMarket.id}_debtors`;
    await AsyncStorage.setItem(key, JSON.stringify(data));
    return data;
  },
});
```

### 5. Security

#### PIN Code
```typescript
// Set PIN
await SecureStore.setItemAsync('security_pin', pin);

// Verify PIN
const stored = await SecureStore.getItemAsync('security_pin');
return stored === enteredPin;
```

#### Biometric
```typescript
import * as LocalAuthentication from 'expo-local-authentication';

const result = await LocalAuthentication.authenticateAsync({
  promptMessage: 'ناسینەوە بۆ بینینی ئەپەکە',
  fallbackLabel: 'بەکارهێنانی PIN',
});
```

## Performance Optimizations

### 1. Pagination
```typescript
const ITEMS_PER_PAGE = 20;
const [currentPage, setCurrentPage] = useState(1);

const filteredDebtors = useMemo(() => {
  return allDebtors.slice(0, currentPage * ITEMS_PER_PAGE);
}, [allDebtors, currentPage]);

const loadMore = () => {
  if (hasMoreItems) {
    setCurrentPage(prev => prev + 1);
  }
};
```

### 2. Memoization
```typescript
// useMemo بۆ expensive calculations
const sortedDebtors = useMemo(() => {
  return [...debtors].sort((a, b) => b.totalDebt - a.totalDebt);
}, [debtors]);

// useCallback بۆ functions
const addDebtor = useCallback((name: string, ...) => {
  // ...
}, [dependencies]);
```

### 3. FlatList Optimization
```typescript
<FlatList
  data={data}
  renderItem={renderItem}
  keyExtractor={item => item.id}
  windowSize={10}
  maxToRenderPerBatch={10}
  initialNumToRender={20}
  removeClippedSubviews={true}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
/>
```

## Platform Compatibility

### Web Compatibility
```typescript
// Web-specific code
if (Platform.OS === 'web') {
  // Web implementation
} else {
  // Native implementation
}
```

### Examples:
```typescript
// Haptics (native only)
if (Platform.OS !== 'web') {
  await Haptics.selectionAsync();
}

// SMS (native only)
if (Platform.OS !== 'web') {
  await SMS.sendSMSAsync([phone], message);
}

// Print
if (Platform.OS === 'web') {
  window.print();
} else {
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri);
}
```

## Error Handling

### Global Error Boundary
```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
    // Log to error tracking service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Try-Catch Patterns
```typescript
try {
  await someAsyncOperation();
  return { success: true, message: 'Success' };
} catch (error) {
  console.error('Operation failed:', error);
  return { success: false, message: 'Error message' };
}
```

## Testing Strategy

### Unit Tests
```typescript
// Test Context hooks
describe('useDebt', () => {
  it('should add debtor', () => {
    const { result } = renderHook(() => useDebt());
    act(() => {
      result.current.addDebtor('Test', '1234567890');
    });
    expect(result.current.debtors).toHaveLength(1);
  });
});
```

### Integration Tests
```typescript
// Test full user flows
describe('Add Debtor Flow', () => {
  it('should add debtor and show in list', async () => {
    const { getByText, getByPlaceholderText } = render(<App />);
    
    fireEvent.press(getByText('+'));
    fireEvent.changeText(getByPlaceholderText('ناو'), 'Test');
    fireEvent.press(getByText('زیادکردن'));
    
    await waitFor(() => {
      expect(getByText('Test')).toBeTruthy();
    });
  });
});
```

## Build & Deployment

### Development
```bash
# Start development server
bun start

# Start with tunnel (for testing on physical device)
bun start --tunnel

# Web preview
bun run start-web
```

### Production Build
```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production

# Both
eas build --platform all --profile production
```

### Submission
```bash
# Submit to App Store
eas submit --platform ios

# Submit to Play Store
eas submit --platform android
```

## Environment Variables

```
EXPO_PUBLIC_TOOLKIT_URL=...  # AI toolkit URL (if using AI features)
```

## Dependencies

### Core Dependencies
```json
{
  "expo": "^53.0.4",
  "react": "19.0.0",
  "react-native": "0.79.1",
  "expo-router": "~5.0.3",
  "typescript": "~5.8.3"
}
```

### State Management
```json
{
  "@tanstack/react-query": "^5.90.5",
  "@nkzw/create-context-hook": "^1.1.0",
  "@react-native-async-storage/async-storage": "2.1.2"
}
```

### UI & UX
```json
{
  "lucide-react-native": "^0.475.0",
  "expo-linear-gradient": "~14.1.4",
  "expo-blur": "~14.1.4",
  "react-native-svg": "15.11.2"
}
```

### Native Features
```json
{
  "expo-camera": "~16.1.11",
  "expo-local-authentication": "~16.0.5",
  "expo-notifications": "~0.31.4",
  "expo-print": "~14.1.4",
  "expo-sharing": "~13.1.5",
  "expo-sms": "~13.1.4",
  "expo-linking": "~7.1.4"
}
```

## Known Issues & Limitations

### WhatsApp on iOS
- Required: Add `whatsapp` to `LSApplicationQueriesSchemes` in `app.json`
- See: `SETUP_GUIDE.md` for instructions

### Web Limitations
- Some native features not available (Haptics, SMS, etc.)
- Camera permission handling different
- Print implementation different

### Expo Go Limitations
- Can't use custom native modules
- Limited push notification functionality
- Some native features require custom dev build

## Future Improvements

### Performance
- [ ] Implement virtual scrolling for large lists
- [ ] Add database (SQLite) for better performance
- [ ] Optimize image loading and caching

### Features
- [ ] Cloud sync (iCloud/Google Drive)
- [ ] Multi-language support
- [ ] Dark mode improvements
- [ ] Advanced analytics

### Architecture
- [ ] Consider React Native Reanimated for animations
- [ ] Add Redux or Zustand for complex state
- [ ] Implement proper error tracking (Sentry)
- [ ] Add analytics (Firebase Analytics)

---

**Note:** This is a living document and will be updated as the project evolves.
