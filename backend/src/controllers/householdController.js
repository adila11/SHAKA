import { dbStore } from '../data/dbStore.js';

export const getMembers = async (req, res, next) => {
  try {
    const users = await dbStore.users.find();
    const safeUsers = users.map(u => ({
      username: u.username,
      email: u.email,
      role: u.role || 'Member',
      avatar: u.avatar || 'profile1',
      profileImage: u.profileImage || 'profile1',
      accessCodeEnabled: Boolean(u.accessCodeEnabled),
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
    res.status(200).json({ success: true, data: safeUsers });
  } catch (error) {
    next(error);
  }
};

export const getBalances = async (req, res, next) => {
  try {
    const transactions = await dbStore.transactions.find();
    const users = await dbStore.users.find();

    const splitTxs = transactions.filter(t => t.isSplit);

    const spentByMember = {};
    users.forEach(u => {
      spentByMember[u.username] = 0;
    });

    splitTxs.forEach(t => {
      const userKey = t.user || users[0]?.username || 'abdulshamil';
      spentByMember[userKey] = (spentByMember[userKey] || 0) + Number(t.amount || 0);
    });

    const totalSplit = splitTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const memberCount = Object.keys(spentByMember).length || 1;
    const equalShare = Math.round(totalSplit / memberCount);

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
