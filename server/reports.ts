import { storage } from "./storage";
import { Resend } from 'resend';
import type { Trade, PortfolioHistory } from "@shared/schema";

let cachedCredentials: { apiKey: string; fromEmail: string | null } | null = null;
let credentialsCacheTime = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000;

async function getResendCredentials(): Promise<{ apiKey: string; fromEmail: string | null }> {
  const now = Date.now();
  if (cachedCredentials && (now - credentialsCacheTime) < CACHE_DURATION_MS) {
    return cachedCredentials;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  if (!hostname) {
    throw new Error('Resend integration not configured: REPLIT_CONNECTORS_HOSTNAME missing');
  }

  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('Resend integration not configured: authentication token missing');
  }

  try {
    const response = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Resend credentials: ${response.status}`);
    }

    const data = await response.json();
    const connectionSettings = data.items?.[0];

    if (!connectionSettings || !connectionSettings.settings?.api_key) {
      throw new Error('Resend integration not connected. Please configure Resend in your Replit project.');
    }

    cachedCredentials = {
      apiKey: connectionSettings.settings.api_key, 
      fromEmail: connectionSettings.settings.from_email || null
    };
    credentialsCacheTime = now;

    return cachedCredentials;
  } catch (error) {
    cachedCredentials = null;
    credentialsCacheTime = 0;
    throw error;
  }
}

export interface DailyReport {
  date: string;
  portfolioValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  totalTrades: number;
  profitableTrades: number;
  losingTrades: number;
  totalProfit: number;
  totalLoss: number;
  netPnL: number;
  winRate: number;
  topPerformingSymbol: string | null;
  worstPerformingSymbol: string | null;
}

export interface WeeklySummary {
  startDate: string;
  endDate: string;
  startValue: number;
  endValue: number;
  weeklyChange: number;
  weeklyChangePercent: number;
  totalTrades: number;
  profitableTrades: number;
  losingTrades: number;
  netPnL: number;
  winRate: number;
  bestDay: { date: string; pnl: number } | null;
  worstDay: { date: string; pnl: number } | null;
  dailyReports: DailyReport[];
}

export async function generateDailyReport(date?: Date): Promise<DailyReport> {
  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const trades: Trade[] = await storage.getTrades();
  const dayTrades = trades.filter((t: Trade) => {
    if (!t.createdAt) return false;
    const tradeDate = new Date(t.createdAt);
    return tradeDate >= startOfDay && tradeDate <= endOfDay;
  });

  const portfolioHistory: PortfolioHistory[] = await storage.getPortfolioHistory();
  const todayHistory = portfolioHistory.find((h: PortfolioHistory) => {
    if (!h.recordedAt) return false;
    const recordDate = new Date(h.recordedAt);
    return recordDate >= startOfDay && recordDate <= endOfDay;
  });

  const portfolioValue = todayHistory ? parseFloat(todayHistory.totalValue) : 0;
  const dailyChange = todayHistory ? parseFloat(todayHistory.dailyChange || "0") : 0;
  const dailyChangePercent = todayHistory ? parseFloat(todayHistory.dailyChangePercent || "0") : 0;

  const totalTrades = dayTrades.length;
  const profitableTrades = dayTrades.filter((t: Trade) => t.profitLoss && parseFloat(t.profitLoss) > 0).length;
  const losingTrades = dayTrades.filter((t: Trade) => t.profitLoss && parseFloat(t.profitLoss) < 0).length;

  const totalProfit = dayTrades.reduce((sum: number, t: Trade) => {
    const pl = t.profitLoss ? parseFloat(t.profitLoss) : 0;
    return pl > 0 ? sum + pl : sum;
  }, 0);

  const totalLoss = dayTrades.reduce((sum: number, t: Trade) => {
    const pl = t.profitLoss ? parseFloat(t.profitLoss) : 0;
    return pl < 0 ? sum + Math.abs(pl) : sum;
  }, 0);

  const netPnL = totalProfit - totalLoss;
  const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

  const symbolPnL: Record<string, number> = {};
  dayTrades.forEach((t: Trade) => {
    const pair = t.pair;
    const pl = t.profitLoss ? parseFloat(t.profitLoss) : 0;
    symbolPnL[pair] = (symbolPnL[pair] || 0) + pl;
  });

  const symbolEntries = Object.entries(symbolPnL);
  const topPerformingSymbol = symbolEntries.length > 0 
    ? symbolEntries.reduce((a, b) => a[1] > b[1] ? a : b)[0] 
    : null;
  const worstPerformingSymbol = symbolEntries.length > 0 
    ? symbolEntries.reduce((a, b) => a[1] < b[1] ? a : b)[0] 
    : null;

  return {
    date: targetDate.toISOString().split('T')[0],
    portfolioValue,
    dailyChange,
    dailyChangePercent,
    totalTrades,
    profitableTrades,
    losingTrades,
    totalProfit,
    totalLoss,
    netPnL,
    winRate,
    topPerformingSymbol,
    worstPerformingSymbol,
  };
}

export async function generateWeeklySummary(): Promise<WeeklySummary> {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - 7);
  startOfWeek.setHours(0, 0, 0, 0);

  const dailyReports: DailyReport[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const report = await generateDailyReport(date);
    dailyReports.push(report);
  }

  const portfolioHistory = await storage.getPortfolioHistory();
  const sortedHistory = portfolioHistory.sort((a, b) => 
    new Date(a.recordedAt!).getTime() - new Date(b.recordedAt!).getTime()
  );

  const weekHistory = sortedHistory.filter(h => {
    if (!h.recordedAt) return false;
    const date = new Date(h.recordedAt);
    return date >= startOfWeek && date <= today;
  });

  const startValue = weekHistory.length > 0 ? parseFloat(weekHistory[0].totalValue) : 0;
  const endValue = weekHistory.length > 0 ? parseFloat(weekHistory[weekHistory.length - 1].totalValue) : 0;
  const weeklyChange = endValue - startValue;
  const weeklyChangePercent = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;

  const totalTrades = dailyReports.reduce((sum, r) => sum + r.totalTrades, 0);
  const profitableTrades = dailyReports.reduce((sum, r) => sum + r.profitableTrades, 0);
  const losingTrades = dailyReports.reduce((sum, r) => sum + r.losingTrades, 0);
  const netPnL = dailyReports.reduce((sum, r) => sum + r.netPnL, 0);
  const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

  const daysWithTrades = dailyReports.filter(r => r.totalTrades > 0);
  const bestDay = daysWithTrades.length > 0 
    ? daysWithTrades.reduce((a, b) => a.netPnL > b.netPnL ? a : b)
    : null;
  const worstDay = daysWithTrades.length > 0 
    ? daysWithTrades.reduce((a, b) => a.netPnL < b.netPnL ? a : b)
    : null;

  return {
    startDate: startOfWeek.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    startValue,
    endValue,
    weeklyChange,
    weeklyChangePercent,
    totalTrades,
    profitableTrades,
    losingTrades,
    netPnL,
    winRate,
    bestDay: bestDay ? { date: bestDay.date, pnl: bestDay.netPnL } : null,
    worstDay: worstDay ? { date: worstDay.date, pnl: worstDay.netPnL } : null,
    dailyReports,
  };
}

export async function sendWeeklyReportEmail(
  toEmail: string,
  userName: string,
  summary: WeeklySummary
): Promise<boolean> {
  try {
    const { apiKey, fromEmail } = await getResendCredentials();
    const client = new Resend(apiKey);

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(value);
    };

    const formatPercent = (value: number) => {
      const sign = value >= 0 ? '+' : '';
      return `${sign}${value.toFixed(2)}%`;
    };

    const changeColor = summary.weeklyChange >= 0 ? '#22c55e' : '#ef4444';
    const changeSign = summary.weeklyChange >= 0 ? '+' : '';

    const dailyRowsHtml = summary.dailyReports.map(day => {
      const dayColor = day.netPnL >= 0 ? '#22c55e' : '#ef4444';
      const daySign = day.netPnL >= 0 ? '+' : '';
      return `
        <tr style="border-bottom: 1px solid #333;">
          <td style="padding: 12px; color: #94a3b8;">${day.date}</td>
          <td style="padding: 12px; color: ${dayColor}; text-align: left;" dir="ltr">${daySign}${formatCurrency(day.netPnL)}</td>
          <td style="padding: 12px; text-align: center;">${day.totalTrades}</td>
          <td style="padding: 12px; text-align: center;">${day.winRate.toFixed(0)}%</td>
        </tr>
      `;
    }).join('');

    const { data, error } = await client.emails.send({
      from: fromEmail || 'ASINAX Crypto AI <noreply@asinax.com>',
      to: [toEmail],
      subject: `تقرير الأداء الأسبوعي - ASINAX (${summary.startDate} - ${summary.endDate})`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0f; color: #ffffff; padding: 20px; direction: rtl;">
          <div style="max-width: 700px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #fbbf24;">
            
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #fbbf24; font-size: 28px; margin: 0;">ASINAX Crypto AI</h1>
              <p style="color: #94a3b8; margin-top: 10px;">تقرير الأداء الأسبوعي</p>
            </div>
            
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #ffffff; margin-bottom: 5px;">مرحباً ${userName}!</h2>
              <p style="color: #94a3b8;">إليك ملخص أداء محفظتك للفترة من ${summary.startDate} إلى ${summary.endDate}</p>
            </div>

            <div style="background: rgba(251, 191, 36, 0.1); border-radius: 12px; padding: 25px; margin-bottom: 25px;">
              <h3 style="color: #fbbf24; margin-top: 0; margin-bottom: 20px; text-align: center;">ملخص الأداء</h3>
              
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 15px; text-align: center;">
                  <p style="color: #94a3b8; margin: 0 0 5px 0; font-size: 14px;">قيمة المحفظة</p>
                  <p style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold;" dir="ltr">${formatCurrency(summary.endValue)}</p>
                </div>
                
                <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 15px; text-align: center;">
                  <p style="color: #94a3b8; margin: 0 0 5px 0; font-size: 14px;">التغيير الأسبوعي</p>
                  <p style="color: ${changeColor}; margin: 0; font-size: 20px; font-weight: bold;" dir="ltr">${changeSign}${formatCurrency(summary.weeklyChange)}</p>
                  <p style="color: ${changeColor}; margin: 5px 0 0 0; font-size: 14px;" dir="ltr">(${formatPercent(summary.weeklyChangePercent)})</p>
                </div>
                
                <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 15px; text-align: center;">
                  <p style="color: #94a3b8; margin: 0 0 5px 0; font-size: 14px;">إجمالي الصفقات</p>
                  <p style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold;">${summary.totalTrades}</p>
                </div>
                
                <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 15px; text-align: center;">
                  <p style="color: #94a3b8; margin: 0 0 5px 0; font-size: 14px;">نسبة النجاح</p>
                  <p style="color: #22c55e; margin: 0; font-size: 20px; font-weight: bold;">${summary.winRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #ffffff; margin-top: 0; margin-bottom: 15px;">الأداء اليومي</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #fbbf24;">
                    <th style="padding: 12px; text-align: right; color: #fbbf24;">التاريخ</th>
                    <th style="padding: 12px; text-align: left; color: #fbbf24;">الربح/الخسارة</th>
                    <th style="padding: 12px; text-align: center; color: #fbbf24;">الصفقات</th>
                    <th style="padding: 12px; text-align: center; color: #fbbf24;">النجاح</th>
                  </tr>
                </thead>
                <tbody>
                  ${dailyRowsHtml}
                </tbody>
              </table>
            </div>

            ${summary.bestDay || summary.worstDay ? `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px;">
              ${summary.bestDay ? `
              <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid #22c55e; border-radius: 8px; padding: 15px; text-align: center;">
                <p style="color: #94a3b8; margin: 0 0 5px 0; font-size: 14px;">أفضل يوم</p>
                <p style="color: #22c55e; margin: 0; font-size: 16px; font-weight: bold;">${summary.bestDay.date}</p>
                <p style="color: #22c55e; margin: 5px 0 0 0;" dir="ltr">+${formatCurrency(summary.bestDay.pnl)}</p>
              </div>
              ` : ''}
              ${summary.worstDay ? `
              <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; padding: 15px; text-align: center;">
                <p style="color: #94a3b8; margin: 0 0 5px 0; font-size: 14px;">أسوأ يوم</p>
                <p style="color: #ef4444; margin: 0; font-size: 16px; font-weight: bold;">${summary.worstDay.date}</p>
                <p style="color: #ef4444; margin: 5px 0 0 0;" dir="ltr">${formatCurrency(summary.worstDay.pnl)}</p>
              </div>
              ` : ''}
            </div>
            ` : ''}

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;">
              <p style="color: #94a3b8; font-size: 14px;">
                لمشاهدة التفاصيل الكاملة، قم بزيارة لوحة التحكم الخاصة بك
              </p>
              <p style="color: #64748b; font-size: 12px; margin-top: 15px;">
                هذا التقرير تم إنشاؤه تلقائياً بواسطة ASINAX Crypto AI
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending weekly report email:', error);
      return false;
    }

    console.log('Weekly report email sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('Failed to send weekly report email:', error);
    return false;
  }
}

export async function sendDailyReportEmail(
  toEmail: string,
  userName: string,
  report: DailyReport
): Promise<boolean> {
  try {
    const { apiKey, fromEmail } = await getResendCredentials();
    const client = new Resend(apiKey);

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(value);
    };

    const changeColor = report.dailyChange >= 0 ? '#22c55e' : '#ef4444';
    const changeSign = report.dailyChange >= 0 ? '+' : '';
    const pnlColor = report.netPnL >= 0 ? '#22c55e' : '#ef4444';
    const pnlSign = report.netPnL >= 0 ? '+' : '';

    const { data, error } = await client.emails.send({
      from: fromEmail || 'ASINAX Crypto AI <noreply@asinax.com>',
      to: [toEmail],
      subject: `تقرير يومي - ASINAX (${report.date})`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0f; color: #ffffff; padding: 20px; direction: rtl;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #fbbf24;">
            
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #fbbf24; font-size: 28px; margin: 0;">ASINAX Crypto AI</h1>
              <p style="color: #94a3b8; margin-top: 10px;">التقرير اليومي - ${report.date}</p>
            </div>
            
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #ffffff; margin-bottom: 5px;">مرحباً ${userName}!</h2>
            </div>

            <div style="background: rgba(251, 191, 36, 0.1); border-radius: 12px; padding: 25px; margin-bottom: 25px;">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 15px; text-align: center;">
                  <p style="color: #94a3b8; margin: 0 0 5px 0; font-size: 14px;">قيمة المحفظة</p>
                  <p style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold;" dir="ltr">${formatCurrency(report.portfolioValue)}</p>
                </div>
                
                <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 15px; text-align: center;">
                  <p style="color: #94a3b8; margin: 0 0 5px 0; font-size: 14px;">التغيير اليومي</p>
                  <p style="color: ${changeColor}; margin: 0; font-size: 20px; font-weight: bold;" dir="ltr">${changeSign}${formatCurrency(report.dailyChange)}</p>
                  <p style="color: ${changeColor}; margin: 5px 0 0 0; font-size: 14px;" dir="ltr">(${report.dailyChangePercent >= 0 ? '+' : ''}${report.dailyChangePercent.toFixed(2)}%)</p>
                </div>
                
                <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 15px; text-align: center;">
                  <p style="color: #94a3b8; margin: 0 0 5px 0; font-size: 14px;">صافي الربح/الخسارة</p>
                  <p style="color: ${pnlColor}; margin: 0; font-size: 20px; font-weight: bold;" dir="ltr">${pnlSign}${formatCurrency(report.netPnL)}</p>
                </div>
                
                <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 15px; text-align: center;">
                  <p style="color: #94a3b8; margin: 0 0 5px 0; font-size: 14px;">نسبة النجاح</p>
                  <p style="color: #22c55e; margin: 0; font-size: 20px; font-weight: bold;">${report.winRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #ffffff; margin-top: 0; margin-bottom: 15px; text-align: center;">ملخص الصفقات</h3>
              <div style="display: flex; justify-content: space-around; text-align: center;">
                <div>
                  <p style="color: #94a3b8; margin: 0 0 5px 0; font-size: 14px;">إجمالي</p>
                  <p style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">${report.totalTrades}</p>
                </div>
                <div>
                  <p style="color: #94a3b8; margin: 0 0 5px 0; font-size: 14px;">رابحة</p>
                  <p style="color: #22c55e; margin: 0; font-size: 24px; font-weight: bold;">${report.profitableTrades}</p>
                </div>
                <div>
                  <p style="color: #94a3b8; margin: 0 0 5px 0; font-size: 14px;">خاسرة</p>
                  <p style="color: #ef4444; margin: 0; font-size: 24px; font-weight: bold;">${report.losingTrades}</p>
                </div>
              </div>
            </div>

            ${report.topPerformingSymbol ? `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px;">
              <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid #22c55e; border-radius: 8px; padding: 15px; text-align: center;">
                <p style="color: #94a3b8; margin: 0 0 5px 0; font-size: 14px;">أفضل عملة</p>
                <p style="color: #22c55e; margin: 0; font-size: 16px; font-weight: bold;">${report.topPerformingSymbol}</p>
              </div>
              ${report.worstPerformingSymbol ? `
              <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; padding: 15px; text-align: center;">
                <p style="color: #94a3b8; margin: 0 0 5px 0; font-size: 14px;">أسوأ عملة</p>
                <p style="color: #ef4444; margin: 0; font-size: 16px; font-weight: bold;">${report.worstPerformingSymbol}</p>
              </div>
              ` : ''}
            </div>
            ` : ''}

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;">
              <p style="color: #64748b; font-size: 12px;">
                هذا التقرير تم إنشاؤه تلقائياً بواسطة ASINAX Crypto AI
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending daily report email:', error);
      return false;
    }

    console.log('Daily report email sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('Failed to send daily report email:', error);
    return false;
  }
}
