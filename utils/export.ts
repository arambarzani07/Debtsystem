import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { Debtor } from '@/types';

export const formatCurrency = (amount: number) => {
  return amount.toLocaleString('en-US');
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export const generateDebtorPDF = async (debtor: Debtor) => {
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ku">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ڕاپۆرتی ${debtor.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      background: #f5f5f5;
      direction: rtl;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #3B82F6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1E293B;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header .date {
      color: #64748B;
      font-size: 14px;
    }
    .customer-info {
      background: #F1F5F9;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #E2E8F0;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #64748B;
      font-weight: 600;
    }
    .info-value {
      color: #1E293B;
      font-weight: 700;
    }
    .debt-summary {
      text-align: center;
      padding: 30px;
      background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
      color: white;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .debt-summary .label {
      font-size: 16px;
      opacity: 0.9;
      margin-bottom: 10px;
    }
    .debt-summary .amount {
      font-size: 48px;
      font-weight: 700;
    }
    .debt-summary .status {
      font-size: 14px;
      opacity: 0.8;
      margin-top: 10px;
    }
    .transactions {
      margin-top: 30px;
    }
    .transactions h2 {
      color: #1E293B;
      font-size: 20px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #E2E8F0;
    }
    .transaction {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: #F8FAFC;
      border-radius: 8px;
      margin-bottom: 10px;
      border-right: 4px solid #3B82F6;
    }
    .transaction.debt {
      border-right-color: #EF4444;
    }
    .transaction.payment {
      border-right-color: #10B981;
    }
    .transaction-details {
      flex: 1;
    }
    .transaction-description {
      color: #1E293B;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .transaction-date {
      color: #64748B;
      font-size: 12px;
    }
    .transaction-amount {
      font-weight: 700;
      font-size: 18px;
    }
    .transaction-amount.debt {
      color: #EF4444;
    }
    .transaction-amount.payment {
      color: #10B981;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #E2E8F0;
      text-align: center;
      color: #64748B;
      font-size: 12px;
    }
    .notes {
      margin-top: 30px;
      padding: 20px;
      background: #FEF3C7;
      border-radius: 8px;
      border-right: 4px solid #F59E0B;
    }
    .notes h3 {
      color: #92400E;
      font-size: 16px;
      margin-bottom: 10px;
    }
    .notes p {
      color: #78350F;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ڕاپۆرتی کڕیار</h1>
      <div class="date">بەرواری چاپکردن: ${formatDate(new Date().toISOString())}</div>
    </div>

    <div class="customer-info">
      <div class="info-row">
        <span class="info-label">ناوی کڕیار:</span>
        <span class="info-value">${debtor.name}</span>
      </div>
      ${debtor.phone ? `
      <div class="info-row">
        <span class="info-label">ژمارەی تەلەفۆن:</span>
        <span class="info-value">${debtor.phone}</span>
      </div>
      ` : ''}
      <div class="info-row">
        <span class="info-label">بەرواری تۆمارکردن:</span>
        <span class="info-value">${formatDate(debtor.createdAt)}</span>
      </div>
      ${debtor.debtLimit ? `
      <div class="info-row">
        <span class="info-label">سنووری قەرز:</span>
        <span class="info-value">${formatCurrency(debtor.debtLimit)}</span>
      </div>
      ` : ''}
    </div>

    <div class="debt-summary">
      <div class="label">کۆی قەرز</div>
      <div class="amount">${formatCurrency(Math.abs(debtor.totalDebt))}</div>
      <div class="status">
        ${debtor.totalDebt > 0 ? 'قەرزی لەسەرە' : debtor.totalDebt < 0 ? 'وەرگیراوە' : 'هاوسەنگە'}
      </div>
    </div>

    ${debtor.notes ? `
    <div class="notes">
      <h3>تێبینیەکان</h3>
      <p>${debtor.notes}</p>
    </div>
    ` : ''}

    <div class="transactions">
      <h2>مێژووی مامەڵەکان (${debtor.transactions.length})</h2>
      ${debtor.transactions.length === 0 ? `
        <p style="text-align: center; color: #64748B; padding: 40px;">هیچ مامەڵەیەک نییە</p>
      ` : debtor.transactions.slice().reverse().map(transaction => `
        <div class="transaction ${transaction.type}">
          <div class="transaction-details">
            <div class="transaction-description">${transaction.description}</div>
            <div class="transaction-date">${formatDate(transaction.date)}</div>
          </div>
          <div class="transaction-amount ${transaction.type}">
            ${transaction.type === 'debt' ? '+' : '-'}${formatCurrency(transaction.amount)}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="footer">
      <p>ئەم ڕاپۆرتە لە سیستەمی قەرزدا دروستکراوە</p>
      <p>${formatDate(new Date().toISOString())}</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return true;
    } else {
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      }
      return true;
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

export const generateOverallPDF = async (debtors: Debtor[]) => {
  const totalDebt = debtors.reduce((sum, d) => sum + Math.max(0, d.totalDebt), 0);
  const totalCredit = debtors.reduce((sum, d) => sum + Math.abs(Math.min(0, d.totalDebt)), 0);
  const activeCustomers = debtors.filter(d => d.totalDebt > 0).length;

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ku">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ڕاپۆرتی گشتی</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      background: #f5f5f5;
      direction: rtl;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #3B82F6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1E293B;
      font-size: 32px;
      margin-bottom: 10px;
    }
    .header .date {
      color: #64748B;
      font-size: 14px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      border: 2px solid #CBD5E1;
    }
    .stat-label {
      color: #64748B;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .stat-value {
      color: #1E293B;
      font-size: 28px;
      font-weight: 700;
    }
    .stat-value.debt {
      color: #EF4444;
    }
    .stat-value.credit {
      color: #10B981;
    }
    .stat-value.active {
      color: #3B82F6;
    }
    .customers-table {
      margin-top: 30px;
    }
    .customers-table h2 {
      color: #1E293B;
      font-size: 20px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #E2E8F0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px;
      text-align: right;
      border-bottom: 1px solid #E2E8F0;
    }
    th {
      background: #F1F5F9;
      color: #475569;
      font-weight: 600;
    }
    td {
      color: #1E293B;
    }
    .debt-amount {
      font-weight: 700;
      color: #EF4444;
    }
    .credit-amount {
      font-weight: 700;
      color: #10B981;
    }
    .zero-amount {
      font-weight: 700;
      color: #64748B;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #E2E8F0;
      text-align: center;
      color: #64748B;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ڕاپۆرتی گشتی</h1>
      <div class="date">بەرواری چاپکردن: ${formatDate(new Date().toISOString())}</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">کۆی قەرز</div>
        <div class="stat-value debt">${formatCurrency(totalDebt)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">کۆی وەرگیراوە</div>
        <div class="stat-value credit">${formatCurrency(totalCredit)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">کڕیاری چالاک</div>
        <div class="stat-value active">${activeCustomers}</div>
      </div>
    </div>

    <div class="customers-table">
      <h2>لیستی کڕیاران (${debtors.length})</h2>
      <table>
        <thead>
          <tr>
            <th>ژمارە</th>
            <th>ناو</th>
            <th>تەلەفۆن</th>
            <th>کۆی قەرز</th>
            <th>ژمارەی مامەڵە</th>
          </tr>
        </thead>
        <tbody>
          ${debtors.map((debtor, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${debtor.name}</td>
              <td>${debtor.phone || '-'}</td>
              <td class="${debtor.totalDebt > 0 ? 'debt-amount' : debtor.totalDebt < 0 ? 'credit-amount' : 'zero-amount'}">
                ${formatCurrency(Math.abs(debtor.totalDebt))}
              </td>
              <td>${debtor.transactions.length}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>ئەم ڕاپۆرتە لە سیستەمی قەرزدا دروستکراوە</p>
      <p>${formatDate(new Date().toISOString())}</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return true;
    } else {
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      }
      return true;
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

export const generateSummaryReport = async (debtors: Debtor[]) => {
  try {
    const result = await generateOverallPDF(debtors);
    return { success: result };
  } catch (error) {
    console.error('Error generating summary report:', error);
    return { success: false, error: 'Failed to generate summary report' };
  }
};

export const generateFullReport = async (debtors: Debtor[]) => {
  try {
    const result = await generateOverallPDF(debtors);
    return { success: result };
  } catch (error) {
    console.error('Error generating full report:', error);
    return { success: false, error: 'Failed to generate full report' };
  }
};

export const printReport = async (debtors: Debtor[]) => {
  try {
    const result = await generateOverallPDF(debtors);
    return { success: result };
  } catch (error) {
    console.error('Error printing report:', error);
    return { success: false, error: 'Failed to print report' };
  }
};

export const exportToCSV = async (debtors: Debtor[]) => {
  try {
    const csvHeader = 'Name,Phone,Total Debt,Transactions Count,Created At\n';
    const csvRows = debtors.map(debtor => 
      `"${debtor.name}","${debtor.phone || ''}",${debtor.totalDebt},${debtor.transactions.length},"${formatDate(debtor.createdAt)}"`
    ).join('\n');
    
    const csv = csvHeader + csvRows;
    
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'customers-data.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } else {
      const htmlTable = `
<!DOCTYPE html>
<html dir="rtl" lang="ku">
<head>
  <meta charset="UTF-8">
  <title>بەڵگەی CSV</title>
</head>
<body>
  <pre>${csv}</pre>
</body>
</html>
      `;
      const { uri } = await Print.printToFileAsync({ html: htmlTable });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      }
      return true;
    }
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return false;
  }
};
