import { dbStore } from '../data/dbStore.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const transactions = await dbStore.transactions.find();
    const monthlyLimit = await dbStore.budget.getMonthlyLimit();

    const totalSpent = transactions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const remainingLimit = Math.max(0, monthlyLimit - totalSpent);
    const percentSpent = monthlyLimit > 0 ? Number(((totalSpent / monthlyLimit) * 100).toFixed(1)) : 0;

    const todayLogs = transactions.filter(t => t.date === 'Nov 22' || t.time === 'Just now');
    const todaySpent = todayLogs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const todayLogsCount = todayLogs.length;

    const categoryTotals = {};
    transactions.forEach(t => {
      if (t.category) {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount || 0);
      }
    });

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
