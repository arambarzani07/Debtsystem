import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Platform } from 'react-native';
import type { Debtor, Transaction } from '@/types';

export async function exportToExcel(debtors: Debtor[]): Promise<boolean> {
  try {
    let csvContent = '\uFEFF';
    csvContent += 'ID,ناوی کڕیار,ژمارە تەلەفون,کۆی قەرز,بەروار,تێبینی\n';

    debtors.forEach((debtor) => {
      const row = [
        debtor.id,
        `"${debtor.name.replace(/"/g, '""')}"`,
        debtor.phone || '',
        debtor.totalDebt,
        new Date(debtor.createdAt).toLocaleDateString('en-US'),
        `"${(debtor.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
      csvContent += row + '\n';
    });

    const fileName = `debtors_export_${Date.now()}.csv`;
    
    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const fileUri = ((FileSystem as any).documentDirectory || '') + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: 'utf8',
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'هەناردەی داتا',
          UTI: 'public.comma-separated-values-text',
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
}

export async function exportTransactionsToExcel(
  transactions: (Transaction & { debtorName: string })[]
): Promise<boolean> {
  try {
    let csvContent = '\uFEFF';
    csvContent += 'ID,ناوی کڕیار,جۆر,بڕ,وەسف,بەروار\n';

    transactions.forEach((transaction) => {
      const row = [
        transaction.id,
        `"${transaction.debtorName.replace(/"/g, '""')}"`,
        transaction.type === 'debt' ? 'قەرز' : 'پارەدان',
        transaction.amount,
        `"${transaction.description.replace(/"/g, '""')}"`,
        new Date(transaction.date).toLocaleDateString('en-US'),
      ].join(',');
      csvContent += row + '\n';
    });

    const fileName = `transactions_export_${Date.now()}.csv`;
    
    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const fileUri = ((FileSystem as any).documentDirectory || '') + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: 'utf8',
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'هەناردەی مامەڵەکان',
          UTI: 'public.comma-separated-values-text',
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error exporting transactions to Excel:', error);
    return false;
  }
}

export async function exportDetailedReport(debtors: Debtor[]): Promise<boolean> {
  try {
    let csvContent = '\uFEFF';
    csvContent += 'ناوی کڕیار,کۆی قەرز,ژمارە مامەڵەکان,کۆی قەرزەکان,کۆی پارەدانەکان,بەروار,ژمارە تەلەفون\n';

    debtors.forEach((debtor) => {
      const totalTransactions = debtor.transactions.length;
      const totalDebts = debtor.transactions
        .filter(t => t.type === 'debt')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalPayments = debtor.transactions
        .filter(t => t.type === 'payment')
        .reduce((sum, t) => sum + t.amount, 0);

      const row = [
        `"${debtor.name.replace(/"/g, '""')}"`,
        debtor.totalDebt,
        totalTransactions,
        totalDebts,
        totalPayments,
        new Date(debtor.createdAt).toLocaleDateString('en-US'),
        debtor.phone || '',
      ].join(',');
      csvContent += row + '\n';
    });

    csvContent += '\n\nکورتەی گشتی\n';
    const totalDebt = debtors.reduce((sum, d) => sum + (d.totalDebt > 0 ? d.totalDebt : 0), 0);
    const totalPaid = debtors.reduce((sum, d) => sum + (d.totalDebt < 0 ? Math.abs(d.totalDebt) : 0), 0);
    csvContent += `کۆی قەرز,${totalDebt}\n`;
    csvContent += `کۆی پارەدراوە,${totalPaid}\n`;

    const fileName = `detailed_report_${Date.now()}.csv`;
    
    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const fileUri = ((FileSystem as any).documentDirectory || '') + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: 'utf8',
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'هەناردەی ڕاپۆرت',
          UTI: 'public.comma-separated-values-text',
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error exporting detailed report:', error);
    return false;
  }
}

export async function printReport(debtors: Debtor[]): Promise<boolean> {
  try {
    const totalDebt = debtors.reduce((sum, d) => sum + Math.max(0, d.totalDebt), 0);
    const totalPaid = debtors.reduce((sum, d) => sum + Math.abs(Math.min(0, d.totalDebt)), 0);
    const activeCustomers = debtors.filter(d => d.totalDebt > 0).length;
    
    let html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          direction: rtl;
          padding: 20px;
          color: #1F2937;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #3B82F6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #1E40AF;
          margin: 0 0 10px 0;
          font-size: 32px;
        }
        .date {
          color: #6B7280;
          font-size: 14px;
        }
        .summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-card {
          background: #F3F4F6;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          border: 2px solid #E5E7EB;
        }
        .summary-label {
          font-size: 14px;
          color: #6B7280;
          margin-bottom: 8px;
        }
        .summary-value {
          font-size: 28px;
          font-weight: bold;
        }
        .debt { color: #EF4444; }
        .credit { color: #10B981; }
        .active { color: #3B82F6; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        th, td {
          padding: 12px;
          text-align: right;
          border-bottom: 1px solid #E5E7EB;
        }
        th {
          background: #F9FAFB;
          font-weight: bold;
          color: #374151;
          border-top: 2px solid #3B82F6;
        }
        tr:hover {
          background: #F9FAFB;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #E5E7EB;
          text-align: center;
          color: #6B7280;
          font-size: 12px;
        }
        @media print {
          body { padding: 0; }
          .summary { page-break-after: avoid; }
          table { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ڕاپۆرتی گشتی قەرزەکان</h1>
        <div class="date">بەروار: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
      
      <div class="summary">
        <div class="summary-card">
          <div class="summary-label">کۆی قەرز</div>
          <div class="summary-value debt">${totalDebt.toLocaleString('en-US')}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">کۆی وەرگیراوە</div>
          <div class="summary-value credit">${totalPaid.toLocaleString('en-US')}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">کڕیاری چالاک</div>
          <div class="summary-value active">${activeCustomers}</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>ژمارە</th>
            <th>ناوی کڕیار</th>
            <th>ژمارە تەلەفۆن</th>
            <th>کۆی قەرز</th>
            <th>ژمارە مامەڵەکان</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    debtors.forEach((debtor, index) => {
      const debtClass = debtor.totalDebt > 0 ? 'debt' : debtor.totalDebt < 0 ? 'credit' : '';
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>${debtor.name}</td>
          <td>${debtor.phone || '-'}</td>
          <td class="${debtClass}">${debtor.totalDebt.toLocaleString('en-US')}</td>
          <td>${debtor.transactions.length}</td>
        </tr>
      `;
    });
    
    html += `
        </tbody>
      </table>
      
      <div class="footer">
        ئەم ڕاپۆرتە بە شێوەی خۆکار دروستکراوە
      </div>
    </body>
    </html>
    `;
    
    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      }
    } else {
      await Print.printAsync({ html });
    }
    
    return true;
  } catch (error) {
    console.error('Error printing report:', error);
    return false;
  }
}
