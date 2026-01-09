import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Debtor, Market } from '@/types';

export async function generateInvoice(debtor: Debtor, market: Market | null): Promise<boolean> {
  try {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const transactions = [...debtor.transactions].reverse();

    const transactionsHTML = transactions
      .map(
        (t, index) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; text-align: right;">${index + 1}</td>
        <td style="padding: 12px; text-align: right;">${t.description}</td>
        <td style="padding: 12px; text-align: right;">${new Date(t.date).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
        <td style="padding: 12px; text-align: right; color: ${t.type === 'debt' ? '#ef4444' : '#10b981'}; font-weight: 700;">
          ${t.type === 'debt' ? '+' : '-'}${t.amount.toLocaleString()}
        </td>
      </tr>
    `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none; }
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            background: #ffffff;
            direction: rtl;
            max-width: 900px;
            margin: 0 auto;
          }
          .document-wrapper {
            border: 3px solid #2563eb;
            padding: 40px;
            background: #ffffff;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
            position: relative;
          }
          .document-wrapper::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 25px;
            border-bottom: 4px double #2563eb;
            background: linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%);
            padding: 30px;
            border-radius: 8px;
          }
          .header h1 {
            color: #1e40af;
            font-size: 48px;
            margin-bottom: 15px;
            font-weight: 900;
            letter-spacing: 2px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.15);
            text-transform: uppercase;
          }
          .header-subtitle {
            color: #64748b;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            letter-spacing: 0.5px;
          }
          .customer-info-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 25px;
            padding: 20px;
            background: #eff6ff;
            border-radius: 8px;
            border-right: 5px solid #2563eb;
            border-left: 5px solid #2563eb;
          }
          .customer-info-header div {
            flex: 1;
          }
          .customer-info-header p {
            font-size: 19px;
            color: #0f172a;
            font-weight: 700;
            margin: 5px 0;
          }
          .info-section {
            background: #f8fafc;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 30px;
            border: 1px solid #e2e8f0;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px;
            background: white;
            border-radius: 6px;
            border-right: 3px solid #3b82f6;
          }
          .info-label {
            font-weight: 700;
            color: #1e40af;
            font-size: 15px;
          }
          .info-value {
            color: #0f172a;
            font-weight: 600;
            font-size: 15px;
          }
          .summary {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
            box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
            border: 3px solid #1e40af;
          }
          .summary h2 {
            color: #ffffff;
            margin-bottom: 15px;
            font-size: 24px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .summary .amount {
            font-size: 56px;
            font-weight: 900;
            color: #ffffff;
            text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
            margin: 15px 0;
            letter-spacing: 2px;
          }
          .summary .status {
            color: #dbeafe;
            margin-top: 15px;
            font-size: 18px;
            font-weight: 600;
            background: rgba(255, 255, 255, 0.2);
            padding: 10px 20px;
            border-radius: 20px;
            display: inline-block;
          }
          .section-title {
            color: #1e40af;
            margin-bottom: 20px;
            font-size: 26px;
            font-weight: 800;
            padding-bottom: 10px;
            border-bottom: 3px solid #3b82f6;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }
          th {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 18px;
            text-align: right;
            font-size: 17px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          td {
            padding: 15px;
            text-align: right;
            font-size: 15px;
            font-weight: 500;
            color: #0f172a;
          }
          tbody tr {
            border-bottom: 1px solid #e2e8f0;
            transition: background 0.3s;
          }
          tbody tr:hover {
            background: #f8fafc;
          }
          tbody tr:last-child {
            border-bottom: none;
          }
          .footer {
            text-align: center;
            color: #475569;
            font-size: 14px;
            border-top: 3px double #cbd5e1;
            padding-top: 25px;
            margin-top: 40px;
            background: #f8fafc;
            padding: 25px;
            border-radius: 8px;
            border: 2px solid #e2e8f0;
          }
          .footer p {
            margin: 8px 0;
            line-height: 1.8;
          }
          .footer-highlight {
            font-weight: 800;
            color: #dc2626;
            font-size: 18px;
            margin-bottom: 20px;
            background: #fee2e2;
            padding: 12px 20px;
            border-radius: 8px;
            display: inline-block;
            border: 2px solid #fca5a5;
          }
          .footer-verify {
            font-weight: 700;
            color: #059669;
            font-size: 16px;
            margin-top: 15px;
            background: #d1fae5;
            padding: 10px 20px;
            border-radius: 6px;
            display: inline-block;
            border: 2px solid #6ee7b7;
          }
          .stamp-area {
            margin-top: 60px;
            padding: 30px;
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            text-align: center;
            background: #fafafa;
          }
          .stamp-area p {
            color: #64748b;
            font-size: 14px;
            margin: 10px 0;
          }
          .signature-line {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            padding-top: 20px;
          }
          .signature-box {
            flex: 1;
            text-align: center;
            padding: 20px;
          }
          .signature-box p {
            color: #475569;
            font-weight: 600;
            margin-bottom: 40px;
          }
          .signature-box .line {
            border-top: 2px solid #64748b;
            width: 220px;
            margin: 0 auto;
          }
          .stamp-section {
            margin-top: 40px;
            padding: 25px;
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            background: #fafafa;
            text-align: center;
          }
          .stamp-section p {
            color: #64748b;
            font-size: 14px;
            font-weight: 600;
            margin: 8px 0;
          }
          .stamp-box {
            width: 150px;
            height: 150px;
            border: 3px solid #cbd5e1;
            border-radius: 50%;
            margin: 20px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
          }
          .official-badge {
            display: inline-block;
            padding: 8px 20px;
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            font-weight: 700;
            font-size: 14px;
            border-radius: 20px;
            margin-top: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
          }
          .interest-notice {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
            border: 2px solid #fbbf24;
            box-shadow: 0 4px 6px rgba(251, 191, 36, 0.2);
          }
          .interest-notice p {
            color: #92400e;
            font-size: 17px;
            font-weight: 700;
          }
          .document-id {
            text-align: center;
            color: #94a3b8;
            font-size: 12px;
            margin-top: 20px;
            font-family: monospace;
            padding: 15px;
            background: #f1f5f9;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            color: rgba(37, 99, 235, 0.03);
            font-weight: 900;
            pointer-events: none;
            z-index: 0;
            white-space: nowrap;
          }
          .content-layer {
            position: relative;
            z-index: 1;
          }
        </style>
      </head>
      <body>
        <div class="document-wrapper">
          <div class="watermark">وەسڵی فەرمی</div>
          <div class="content-layer">
          <div class="header">
            <h1>${market?.name || 'مارکێت'}</h1>
            <p class="header-subtitle">وەسڵی فەرمی - ڕاپۆرتی قەرز و مامەڵە</p>
            <div class="customer-info-header">
              <div style="text-align: right;">
                <p>ناوی کڕیار: ${debtor.name}</p>
              </div>
              <div style="text-align: left;">
                <p>بەرواری وەسڵ: ${today}</p>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3 style="color: #1e40af; margin-bottom: 20px; font-size: 20px; font-weight: 700;">زانیاری کڕیار</h3>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">ناوی کڕیار:</span>
                <span class="info-value">${debtor.name}</span>
              </div>
              ${
                debtor.phone
                  ? `
              <div class="info-row">
                <span class="info-label">ژمارەی تەلەفۆن:</span>
                <span class="info-value">${debtor.phone}</span>
              </div>
              `
                  : ''
              }
              ${
                debtor.category
                  ? `
              <div class="info-row">
                <span class="info-label">پۆلی کڕیار:</span>
                <span class="info-value">${debtor.category === 'VIP' ? 'VIP' : debtor.category === 'Regular' ? 'ئاسایی' : 'کۆگا'}</span>
              </div>
              `
                  : ''
              }
              <div class="info-row">
                <span class="info-label">بەروار:</span>
                <span class="info-value">${today}</span>
              </div>
              <div class="info-row">
                <span class="info-label">ژمارەی مامەڵەکان:</span>
                <span class="info-value">${debtor.transactions.length} مامەڵە</span>
              </div>
            </div>
          </div>

          <div class="summary">
            <h2>کۆی گشتی باڵانس</h2>
            <div class="amount">${Math.abs(debtor.totalDebt).toLocaleString()} دینار</div>
            <div class="status">
              ${debtor.totalDebt > 0 ? 'قەرزی لەسەرە' : debtor.totalDebt < 0 ? 'پارەی وەرگرتووەتەوە' : 'هاوسەنگە'}
            </div>
          </div>

          ${
            debtor.interestRate
              ? `
          <div class="interest-notice">
            <p>🔔 ڕێژەی سوود: ${debtor.interestRate}% لەسەر قەرزەکە</p>
          </div>
          `
              : ''
          }

          <h2 class="section-title">مێژووی مامەڵەکان (${debtor.transactions.length})</h2>
          
          <table>
            <thead>
              <tr>
                <th style="width: 80px;">#</th>
                <th>وردەکاری مامەڵە</th>
                <th style="width: 180px;">بەروار</th>
                <th style="width: 150px;">بڕ (دینار)</th>
              </tr>
            </thead>
            <tbody>
              ${transactionsHTML}
            </tbody>
          </table>

          <div class="stamp-section">
            <p style="color: #1e40af; font-size: 16px; font-weight: 700; margin-bottom: 15px;">بەشی مۆر و واژوو</p>
            <div style="display: flex; justify-content: space-around; align-items: flex-start; margin-top: 30px;">
              <div style="flex: 1; text-align: center;">
                <p style="font-weight: 700; color: #0f172a; margin-bottom: 50px; font-size: 15px;">واژووی کڕیار</p>
                <div style="border-top: 2px solid #64748b; width: 200px; margin: 0 auto;"></div>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 8px;">(${debtor.name})</p>
              </div>
              <div class="stamp-box">
                <p style="color: #cbd5e1; font-size: 13px; font-weight: 700;">مۆری<br/>فەرمی</p>
              </div>
              <div style="flex: 1; text-align: center;">
                <p style="font-weight: 700; color: #0f172a; margin-bottom: 50px; font-size: 15px;">واژووی بەڕێوەبەر</p>
                <div style="border-top: 2px solid #64748b; width: 200px; margin: 0 auto;"></div>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 8px;">(${market?.name || 'مارکێت'})</p>
              </div>
            </div>
            <div class="official-badge" style="margin-top: 30px;">✓ پشتڕاستکراوە</div>
          </div>

          <div class="footer">
            <p class="footer-highlight">⚠️ هەڵە و بەسەرچوون بۆ هەردوو لا دەگەڕێتەوە</p>
            <p style="margin: 15px 0; font-size: 15px; line-height: 1.8;">ئەم وەسڵە فەرمیە لە ڕێگەی سیستەمی بەڕێوەبردنی قەرزەوە دروستکراوە</p>
            <p class="footer-verify">✓ وەسڵی باوەڕپێکراو و پشتڕاستکراو</p>
            <p style="font-weight: 700; margin-top: 20px; color: #1e40af; font-size: 15px;">بەرواری چاپکردن: ${today}</p>
            ${market?.phone ? `<p style="font-weight: 600; color: #64748b; margin-top: 10px;">پەیوەندی: ${market.phone}</p>` : ''}
          </div>

          <div class="document-id">
            <p style="font-weight: 700; color: #1e40af; margin-bottom: 8px;">کۆدی وەسڵی فەرمی</p>
            <p style="font-size: 14px; letter-spacing: 2px;">DOC-${Date.now()}-${debtor.id.slice(0, 8).toUpperCase()}</p>
            <p style="margin-top: 10px; font-size: 11px; color: #64748b;">ئەم کۆدە بۆ دڵنیایی و پشتڕاستکردنەوە بەکاردێت</p>
          </div>
          </div>
        </div>
      </body>
      </html>
    `;

    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return true;
    } else {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
      return true;
    }
  } catch (error) {
    console.error('Error generating invoice:', error);
    return false;
  }
}
