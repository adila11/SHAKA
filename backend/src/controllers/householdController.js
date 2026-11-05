import { store } from '../data/store.js';

export const getMembers = (req, res, next) => {
  try {
    const users = store.get('users') || [];
    const safeUsers = users.map(({ passwordHash, ...user }) => user);
    res.status(200).json({ success: true, data: safeUsers });
  } catch (error) {
    next(error);
  }
};

export const getBalances = (req, res, next) => {
  try {
    const transactions = store.get('transactions') || [];
    const users = store.get('users') || [];

    // Filter split transactions
    const splitTxs = transactions.filter(t => t.isSplit);

    // Calculate spend per member
    const spentByMember = {};
    users.forEach(u => {
      spentByMember[u.name.split(' ')[0]] = 0; // 'Alex', 'Sam', 'Maya'
    });

    splitTxs.forEach(t => {
      const userKey = t.user;
      spentByMember[userKey] = (spentByMember[userKey] || 0) + Number(t.amount);
    });

    const totalSplit = splitTxs.reduce((sum, t) => sum + Number(t.amount), 0);
    const memberCount = Object.keys(spentByMember).length || 1;
    const equalShare = Math.round(totalSplit / memberCount);

    // Balance: > 0 means gets back, < 0 means owes
    const balances = Object.keys(spentByMember).map(name => {
      const paid = spentByMember[name];
      const net = paid - equalShare;
      return {
        name,
        paid,
        equalShare,
        net,
        status: net >= 0 ? `Gets back ₹${net.toLocaleString('en-IN')}` : `Owes ₹${Math.abs(net).toLocaleString('en-IN')}`,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        totalSplitSpend: totalSplit,
        equalSharePerMember: equalShare,
        balances,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const settleBalances = (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Household shared balances have been marked as settled',
      settledAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

