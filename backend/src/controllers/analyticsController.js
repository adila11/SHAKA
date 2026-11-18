import { dbStore } from '../data/dbStore.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const transactions = await dbStore.transactions.find();
    const monthlyLimit = await dbStore.budget.getMonthlyLimit();

    const incomeTxs = transactions.filter(t => t.type === 'income');
    const expenseTxs = transactions.filter(t => t.type !== 'income');

    const totalIncome = incomeTxs.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalExpense = expenseTxs.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalSpent = totalExpense;
    const balance = totalIncome - totalExpense;

    const remainingLimit = Math.max(0, monthlyLimit - totalSpent);
    const percentSpent = monthlyLimit > 0 ? Number(((totalSpent / monthlyLimit) * 100).toFixed(1)) : 0;

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const MONTH_MAP = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };

    const getTxCalTime = (tx) => {
      if (!tx) return 0;
      if (tx.fullDate) {
        const d = new Date(tx.fullDate);
        if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      }
      const rawStr = tx.fullDate || tx.date;
      if (rawStr && typeof rawStr === 'string') {
        const isoMatch = rawStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (isoMatch) return new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10)).getTime();
        const match = rawStr.match(/([a-zA-Z]+)\s*(\d{1,2})(?:,?\s*(\d{4}))?/);
        if (match) {
          const m = MONTH_MAP[match[1].toLowerCase().slice(0, 3)];
          const d = parseInt(match[2], 10);
          const y = match[3] ? parseInt(match[3], 10) : (tx.createdAt ? new Date(tx.createdAt).getFullYear() : now.getFullYear());
          if (m !== undefined && !isNaN(d)) return new Date(y, m, d).getTime();
        }
      }
      if (tx.createdAt) {
        const d = new Date(tx.createdAt);
        if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      }
      return 0;
    };

    const todayLogs = expenseTxs.filter(t => getTxCalTime(t) === todayMidnight);
    const todaySpent = todayLogs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const todayLogsCount = todayLogs.length;

    const categoryTotals = {};
    expenseTxs.forEach(t => {
      if (t.category) {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount || 0);
      }
    });

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const elapsedDays = Math.max(1, currentDay);
    const daysLeft = Math.max(0, daysInMonth - currentDay);
    const dailyAverage = Math.round(totalSpent / elapsedDays);
    const projectedSpend = Math.round((totalSpent / elapsedDays) * daysInMonth);

    const recentTransactions = transactions.slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        currency: '₹',
        monthlyLimit,
        totalIncome,
        totalExpense,
        totalSpent,
        balance,
        remainingLimit,
        percentSpent,
        todaySpent,
        todayLogsCount,
        dailyAverage,
        daysLeft,
        projectedSpend,
        categoryTotals,
        recentTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCategorySpending = async (req, res, next) => {
  try {
    const categories = await dbStore.budget.getCategories();
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyAnalytics = async (req, res, next) => {
  try {
    const transactions = await dbStore.transactions.find();
    const monthlyLimit = await dbStore.budget.getMonthlyLimit();

    const monthlyMap = {};
    transactions.forEach(t => {
      const monthKey = t.fullDate
        ? t.fullDate.replace(/^[^,]+,\s*/, '').trim()
        : 'Current';
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthKey,
          income: 0,
          expenses: 0,
          transactionCount: 0,
        };
      }
      const amt = Number(t.amount || 0);
      if (t.type === 'income') {
        monthlyMap[monthKey].income += amt;
      } else {
        monthlyMap[monthKey].expenses += amt;
      }
      monthlyMap[monthKey].transactionCount += 1;
    });

    res.status(200).json({
      success: true,
      monthlyLimit,
      data: Object.values(monthlyMap),
    });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const transactions = await dbStore.transactions.find();
    const categories = await dbStore.budget.getCategories();
    const monthlyLimit = await dbStore.budget.getMonthlyLimit();

    const totalExpense = transactions
      .filter(t => t.type !== 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpense,
          netBalance: totalIncome - totalExpense,
          monthlyLimit,
          categoryCount: categories.length,
          transactionCount: transactions.length,
        },
        categoryBreakdown: categories,
      },
    });
  } catch (error) {
    next(error);
  }
};
