import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { Setting } from '../models/Setting.js';
import { store } from '../data/store.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;
    let transactions = [];
    let monthlyLimit = 30000;

    if (isMongoConnected) {
      transactions = await Transaction.find().lean();
      const setting = await Setting.findOne({ key: 'global' }).lean();
      if (setting && setting.monthlyLimit) {
        monthlyLimit = setting.monthlyLimit;
      }
    } else {
      transactions = store.get('transactions') || [];
      monthlyLimit = store.get('monthlyLimit') || 30000;
    }

    const totalSpent = transactions.reduce((sum, item) => sum + Number(item.amount), 0);
    const remainingLimit = Math.max(0, monthlyLimit - totalSpent);
    const percentSpent = monthlyLimit > 0 ? Number(((totalSpent / monthlyLimit) * 100).toFixed(1)) : 0;

    const todayLogs = transactions.filter(t => t.date === 'Nov 22');
    const todaySpent = todayLogs.reduce((sum, t) => sum + Number(t.amount), 0);
    const todayLogsCount = todayLogs.length;

    const categoryTotals = {};
    transactions.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
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
