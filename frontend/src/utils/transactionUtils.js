const MONTH_MAP = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

/**
 * Extracts a normalized midnight timestamp (year, month, day) for a transaction's calendar date.
 */
export const getTxCalendarTimestamp = (tx) => {
  if (!tx) return 0;

  // 1. If fullDate is available e.g. "Nov 17, 2026", "2026-11-17", etc.
  if (tx.fullDate) {
    const d = new Date(tx.fullDate);
    if (!isNaN(d.getTime())) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    }
  }

  // 2. Try parsing fullDate or date string
  const rawDateStr = tx.fullDate || tx.date;
  if (rawDateStr && typeof rawDateStr === 'string') {
    // Check ISO YYYY-MM-DD
    const isoMatch = rawDateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const y = parseInt(isoMatch[1], 10);
      const m = parseInt(isoMatch[2], 10) - 1;
      const d = parseInt(isoMatch[3], 10);
      return new Date(y, m, d).getTime();
    }

    // Match "Nov 17" or "Nov 17, 2026"
    const match = rawDateStr.match(/([a-zA-Z]+)\s*(\d{1,2})(?:,?\s*(\d{4}))?/);
    if (match) {
      const monthPrefix = match[1].toLowerCase().slice(0, 3);
      const day = parseInt(match[2], 10);
      const year = match[3]
        ? parseInt(match[3], 10)
        : (tx.createdAt ? new Date(tx.createdAt).getFullYear() : new Date().getFullYear());

      if (MONTH_MAP[monthPrefix] !== undefined && !isNaN(day)) {
        return new Date(year, MONTH_MAP[monthPrefix], day).getTime();
      }
    }
  }

  // 3. Fallback to createdAt timestamp
  if (tx.createdAt) {
    const d = new Date(tx.createdAt);
    if (!isNaN(d.getTime())) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    }
  }

  return 0;
};

/**
 * Sorts transactions strictly in descending order:
 * Primary: Date descending (newest date at the top, oldest date at the bottom)
 * Secondary: For transactions on the same date, most recently added (createdAt) at the top,
 *            earliest added at the bottom.
 * Newly added optimistic transactions (in-flight) appear at the very top.
 */
export const sortTransactionsNewestFirst = (list) => {
  if (!Array.isArray(list)) return [];

  return [...list].sort((a, b) => {
    // Optimistic item (currently being logged right now) stays at the top
    if (a.isOptimistic && !b.isOptimistic) return -1;
    if (b.isOptimistic && !a.isOptimistic) return 1;

    // Primary: Calendar date descending (e.g. Nov 17 > Nov 16 > Nov 15)
    const dateA = getTxCalendarTimestamp(a);
    const dateB = getTxCalendarTimestamp(b);
    if (dateA !== dateB) {
      return dateB - dateA;
    }

    // Secondary: Same calendar date -> sort by creation timestamp descending (last added on top)
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA && timeB && timeA !== timeB) {
      return timeB - timeA;
    }

    // Fallback: Numeric ID comparison (e.g., tx-173185... or temp-tx-173185...)
    const numId = (id) => {
      if (!id || typeof id !== 'string') return 0;
      const m = id.match(/(\d+)/);
      return m ? Number(m[1]) : 0;
    };
    const idA = numId(a.id);
    const idB = numId(b.id);
    if (idA && idB && idA !== idB) {
      return idB - idA;
    }

    return 0;
  });
};

/**
 * Accurately determines if an expense belongs to today.
 * Avoids false positives from past transactions that had static time: 'Just now'.
 */
export const isTransactionToday = (tx) => {
  if (!tx) return false;
  if (tx.type === 'income') return false;

  // Optimistic transaction added in current session is always today
  if (tx.isOptimistic) return true;

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const txDateMidnight = getTxCalendarTimestamp(tx);
  if (txDateMidnight > 0) {
    return txDateMidnight === todayMidnight;
  }

  // Fallback to createdAt if calendar date was not parseable
  if (tx.createdAt) {
    const cd = new Date(tx.createdAt);
    if (!isNaN(cd.getTime())) {
      const cdMidnight = new Date(cd.getFullYear(), cd.getMonth(), cd.getDate()).getTime();
      return cdMidnight === todayMidnight;
    }
  }

  return false;
};

/**
 * Deduplicate transactions by unique ID
 */
export const deduplicateTransactions = (list) => {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const deduped = [];
  for (const item of list) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      deduped.push(item);
    }
  }
  return deduped;
};
