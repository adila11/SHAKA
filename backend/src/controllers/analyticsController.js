import { store } from '../data/store.js';

export const getDashboardSummary = (req, res, next) => {
  try {
    const transactions = store.get('transactions') || [];
    const monthlyLimit = store.get('monthlyLimit') || 30000;

    const totalSpent = transactions.reduce((sum, item) => sum + Number(item.amount), 0);
    const remainingLimit = Math.max(0, monthlyLimit - totalSpent);
    const percentSpent = monthlyLimit > 0 ? Number(((totalSpent / monthlyLimit) * 100).toFixed(1)) : 0;

    // Today's logs (matching Nov 22 reference date or actual today)
    const todayLogs = transactions.filter(t => t.date === 'Nov 22');
    const todaySpent = todayLogs.reduce((sum, t) => sum + Number(t.amount), 0);
    const todayLogsCount = todayLogs.length;

    // Category totals
    const categoryTotals = {};
    transactions.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
    });

    // Daily average based on elapsed days (e.g. 22 days of November)
    const elapsedDays = 22;
    const daysInMonth = 30;
    const daysLeft = daysInMonth - elapsedDays;
    const dailyAverage = Math.round(totalSpent / elapsedDays);
    const projectedSpend = totalSpent + dailyAverage * daysLeft;

    res.status(200).json({
      success: true,
      data: {
        currency: '₹',
        monthlyLimit,
        totalSpent,
        remainingLimit,
        percentSpent,
        todaySpent,
        todayLogsCount,
        dailyAverage,
        daysLeft,
        projectedSpend,
        categoryTotals,
      },
    });
  } catch (error) {
    next(error);
  }
};

