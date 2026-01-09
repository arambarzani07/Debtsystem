import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useMemo, useCallback } from 'react';

export type Language = 'ku' | 'en' | 'ar';

const LANGUAGE_KEY = 'app_language';

interface Translations {
  common: {
    save: string;
    cancel: string;
    edit: string;
    delete: string;
    add: string;
    close: string;
    yes: string;
    no: string;
    confirm: string;
    loading: string;
  };
  debtor: {
    title: string;
    addDebtor: string;
    debtorName: string;
    debtorPhone: string;
    totalDebt: string;
    addDebt: string;
    addPayment: string;
    transactions: string;
    notes: string;
    debtLimit: string;
    noTransactions: string;
  };
  transactions: {
    debt: string;
    payment: string;
    all: string;
    amount: string;
    description: string;
    date: string;
    addTransaction: string;
    editTransaction: string;
    deleteTransaction: string;
    comment: string;
    partialPayment: string;
  };
  settings: {
    title: string;
    theme: string;
    language: string;
    currency: string;
    security: string;
    backup: string;
    exportData: string;
    importData: string;
  };
}

const translations: Record<Language, Translations> = {
  ku: {
    common: {
      save: 'پاشەکەوتکردن',
      cancel: 'پاشگەزبوونەوە',
      edit: 'دەستکاری',
      delete: 'سڕینەوە',
      add: 'زیادکردن',
      close: 'داخستن',
      yes: 'بەڵێ',
      no: 'نەخێر',
      confirm: 'دڵنیاکردنەوە',
      loading: 'چاوەڕوانبە...',
    },
    debtor: {
      title: 'سیستەمی بەڕێوەبردنی قەرز',
      addDebtor: 'کڕیاری نوێ',
      debtorName: 'ناوی کڕیار',
      debtorPhone: 'ژمارەی تەلەفۆن',
      totalDebt: 'کۆی قەرز',
      addDebt: 'پێدانی قەرز',
      addPayment: 'وەرگرتنەوەی قەرز',
      transactions: 'مێژووی مامەڵەکان',
      notes: 'تێبینی',
      debtLimit: 'سنووری قەرز',
      noTransactions: 'هێشتا مامەڵەیەک نییە',
    },
    transactions: {
      debt: 'پێدان',
      payment: 'وەرگرتن',
      all: 'هەموو',
      amount: 'بڕ',
      description: 'وردەکاری',
      date: 'بەروار',
      addTransaction: 'مامەڵەی نوێ',
      editTransaction: 'دەستکاریکردنی مامەڵە',
      deleteTransaction: 'سڕینەوەی مامەڵە',
      comment: 'کۆمینت',
      partialPayment: 'پارەدانەوەی بەشێکی',
    },
    settings: {
      title: 'ڕێکخستنەکان',
      theme: 'ڕواڵەت',
      language: 'زمان',
      currency: 'جۆری پارە',
      security: 'ئاسایش',
      backup: 'پاشەکەوتکردن',
      exportData: 'هاوردەکردنی زانیاریەکان',
      importData: 'گەڕاندنەوەی زانیاریەکان',
    },
  },
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      add: 'Add',
      close: 'Close',
      yes: 'Yes',
      no: 'No',
      confirm: 'Confirm',
      loading: 'Loading...',
    },
    debtor: {
      title: 'Debt Management System',
      addDebtor: 'New Customer',
      debtorName: 'Customer Name',
      debtorPhone: 'Phone Number',
      totalDebt: 'Total Debt',
      addDebt: 'Give Debt',
      addPayment: 'Receive Payment',
      transactions: 'Transaction History',
      notes: 'Notes',
      debtLimit: 'Debt Limit',
      noTransactions: 'No transactions yet',
    },
    transactions: {
      debt: 'Debt',
      payment: 'Payment',
      all: 'All',
      amount: 'Amount',
      description: 'Description',
      date: 'Date',
      addTransaction: 'New Transaction',
      editTransaction: 'Edit Transaction',
      deleteTransaction: 'Delete Transaction',
      comment: 'Comment',
      partialPayment: 'Partial Payment',
    },
    settings: {
      title: 'Settings',
      theme: 'Theme',
      language: 'Language',
      currency: 'Currency',
      security: 'Security',
      backup: 'Backup',
      exportData: 'Export Data',
      importData: 'Import Data',
    },
  },
  ar: {
    common: {
      save: 'حفظ',
      cancel: 'إلغاء',
      edit: 'تعديل',
      delete: 'حذف',
      add: 'إضافة',
      close: 'إغلاق',
      yes: 'نعم',
      no: 'لا',
      confirm: 'تأكيد',
      loading: 'جاري التحميل...',
    },
    debtor: {
      title: 'نظام إدارة الديون',
      addDebtor: 'عميل جديد',
      debtorName: 'اسم العميل',
      debtorPhone: 'رقم الهاتف',
      totalDebt: 'إجمالي الدين',
      addDebt: 'إعطاء دين',
      addPayment: 'استلام دفعة',
      transactions: 'سجل المعاملات',
      notes: 'ملاحظات',
      debtLimit: 'حد الدين',
      noTransactions: 'لا توجد معاملات بعد',
    },
    transactions: {
      debt: 'دين',
      payment: 'دفع',
      all: 'الكل',
      amount: 'المبلغ',
      description: 'الوصف',
      date: 'التاريخ',
      addTransaction: 'معاملة جديدة',
      editTransaction: 'تعديل المعاملة',
      deleteTransaction: 'حذف المعاملة',
      comment: 'تعليق',
      partialPayment: 'دفعة جزئية',
    },
    settings: {
      title: 'الإعدادات',
      theme: 'السمة',
      language: 'اللغة',
      currency: 'العملة',
      security: 'الأمان',
      backup: 'نسخ احتياطي',
      exportData: 'تصدير البيانات',
      importData: 'استيراد البيانات',
    },
  },
};

export const [LanguageContext, useLanguage] = createContextHook(() => {
  const [language, setLanguageState] = useState<Language>('ku');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (!stored || stored === 'undefined' || stored === 'null') {
        return;
      }
      const trimmed = stored.trim();
      if (trimmed === 'ku' || trimmed === 'en' || trimmed === 'ar') {
        setLanguageState(trimmed as Language);
      } else {
        console.warn('Invalid language value, using default');
        await AsyncStorage.removeItem(LANGUAGE_KEY);
      }
    } catch (error) {
      console.error('Error loading language:', error);
      await AsyncStorage.removeItem(LANGUAGE_KEY);
    }
  };

  const setLanguage = useCallback(async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error setting language:', error);
    }
  }, []);

  const t = useMemo(() => translations[language], [language]);

  return useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t]
  );
});
