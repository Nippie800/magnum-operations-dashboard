// src/services/inventoryIntelligence.js

const DAY_MS = 24 * 60 * 60 * 1000;

export function withinDays(ts, days) {
  if (!ts) return false;
  const date =
    ts?.toDate ? ts.toDate() : new Date(ts); // supports Firestore Timestamp or Date/string
  return Date.now() - date.getTime() <= days * DAY_MS;
}

/**
 * Fast-moving items = most "DELIVER" quantity in last N days
 */
export function getFastMovingItems(events, days = 30, top = 5) {
  const deliverTotals = {};

  for (const e of events) {
    if (e.type !== "DELIVER") continue;
    if (!withinDays(e.createdAt || e.timestamp, days)) continue;

    const qty = Number(e.quantity || 0);
    deliverTotals[e.itemId] = (deliverTotals[e.itemId] || 0) + qty;
  }

  return Object.entries(deliverTotals)
    .map(([itemId, deliveredLastDays]) => ({ itemId, deliveredLastDays }))
    .sort((a, b) => b.deliveredLastDays - a.deliveredLastDays)
    .slice(0, top);
}

/**
 * Alerts based on thresholds
 */
export function getStockAlerts(state, thresholds = { low: 20, critical: 5 }) {
  const low = [];
  const critical = [];

  for (const [itemId, item] of Object.entries(state)) {
    const total = Number(item.total || 0);
    if (total <= thresholds.critical) critical.push({ itemId, total });
    else if (total <= thresholds.low) low.push({ itemId, total });
  }

  // sort most urgent first
  critical.sort((a, b) => a.total - b.total);
  low.sort((a, b) => a.total - b.total);

  return { low, critical };
}

/**
 * Reorder risk: if you keep delivering at the recent rate, how soon do you run out?
 * We estimate avg daily delivered over last N days.
 */
export function getReorderRisk(events, state, days = 30) {
  const delivered = {}; // itemId -> qty in last N days
  for (const e of events) {
    if (e.type !== "DELIVER") continue;
    if (!withinDays(e.createdAt || e.timestamp, days)) continue;
    delivered[e.itemId] = (delivered[e.itemId] || 0) + Number(e.quantity || 0);
  }

  const results = [];

  for (const [itemId, item] of Object.entries(state)) {
    const total = Number(item.total || 0);
    const deliveredLastDays = Number(delivered[itemId] || 0);
    const avgDaily = deliveredLastDays / days;

    // If no deliveries recently, risk is low/unknown
    if (avgDaily <= 0) {
      results.push({
        itemId,
        total,
        deliveredLastDays,
        avgDaily: 0,
        daysToZero: Infinity,
        risk: "LOW",
      });
      continue;
    }

    const daysToZero = total / avgDaily;

    let risk = "LOW";
    if (daysToZero <= 7) risk = "HIGH";
    else if (daysToZero <= 21) risk = "MED";

    results.push({
      itemId,
      total,
      deliveredLastDays,
      avgDaily: Number(avgDaily.toFixed(2)),
      daysToZero: Number(daysToZero.toFixed(1)),
      risk,
    });
  }

  // sort high risk first
  const rank = { HIGH: 0, MED: 1, LOW: 2 };
  results.sort((a, b) => rank[a.risk] - rank[b.risk]);

  return results;
}
