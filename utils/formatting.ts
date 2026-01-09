export const formatCurrency = (amount: number, hideAmounts: boolean = false, locale: string = 'en-US'): string => {
  if (hideAmounts) {
    return '***';
  }
  return amount.toLocaleString(locale);
};

export const formatDate = (dateString: string, includeTime: boolean = false): string => {
  const date = new Date(dateString);
  
  if (includeTime) {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
};

export const formatPercentage = (value: number, decimals: number = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} ڕۆژ لەمەوپێش`;
  } else if (diffHours > 0) {
    return `${diffHours} کاتژمێر لەمەوپێش`;
  } else if (diffMins > 0) {
    return `${diffMins} خولەک لەمەوپێش`;
  } else {
    return 'ئێستا';
  }
};
