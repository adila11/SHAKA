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

    const todayMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentMonthName = todayMonths[now.getMonth()];
    const currentDay = now.getDate();
    const todayStr = `${currentMonthName} ${currentDay}`;
    const todayStrPadded = `${currentMonthName} ${String(currentDay).padStart(2, '0')}`;

    const todayLogs = expenseTxs.filter(
      t => {
        if (t.time === 'Just now') return true;
        const d = (t.date || '').toLowerCase();
        return (
          d.includes(todayStr.toLowerCase()) ||
          d.includes(todayStrPadded.toLowerCase()) ||
          d.includes(`${currentDay} ${currentMonthName.toLowerCase()}`) ||
          d.includes(`${String(currentDay).padStart(2, '0')} ${currentMonthName.toLowerCase()}`)
        );
      }
    );
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
