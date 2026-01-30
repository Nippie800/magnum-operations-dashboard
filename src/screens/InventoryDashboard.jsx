import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";
import { computeInventoryState } from "../services/inventoryState";
import { seedInventoryData } from "../services/seedInventoryData";
import {
  getStockAlerts,
  getFastMovingItems,
  getReorderRisk,
} from "../services/inventoryIntelligence";
import { downloadCSV } from "../services/exportCsv";

export default function InventoryDashboard() {
  const [state, setState] = useState({});
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Day 6 controls
  const [search, setSearch] = useState("");
  const [filterLoc, setFilterLoc] = useState("ALL");
  const [lowOnly, setLowOnly] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "inventoryEvents"));
      const raw = snap.docs.map((d) => d.data());

      setEvents(raw);
      setState(computeInventoryState(raw));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Calculations ---------- */

  const items = useMemo(() => Object.values(state), [state]);

  const totalStock = useMemo(
    () => items.reduce((s, i) => s + (Number(i.total) || 0), 0),
    [items]
  );

  const onRoad = useMemo(
    () => items.reduce((s, i) => s + (Number(i.onRoad) || 0), 0),
    [items]
  );

  const lowStockCount = useMemo(
    () => items.filter((i) => (Number(i.total) || 0) <= 10).length,
    [items]
  );

  const allLocations = useMemo(() => {
    return Array.from(
      new Set(items.flatMap((i) => Object.keys(i.locations || {})))
    ).sort();
  }, [items]);

  // Intelligence
  const alerts = useMemo(
    () => getStockAlerts(state, { low: 20, critical: 5 }),
    [state]
  );

  const fastMovers = useMemo(
    () => getFastMovingItems(events, 30, 5),
    [events]
  );

  const reorder = useMemo(
    () => getReorderRisk(events, state, 30),
    [events, state]
  );

  // Filters
  const filteredEntries = useMemo(() => {
    return Object.entries(state).filter(([itemId, item]) => {
      const matchesSearch = itemId
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesLow = !lowOnly || (Number(item.total) || 0) <= 20;

      const matchesLoc =
        filterLoc === "ALL"
          ? true
          : (Number(item.locations?.[filterLoc]) || 0) > 0;

      return matchesSearch && matchesLow && matchesLoc;
    });
  }, [state, search, lowOnly, filterLoc]);

  /* ---------- Colors ---------- */

  const healthColor = (qty) => {
    if (qty <= 5) return "#ff4d4f";
    if (qty <= 20) return "#faad14";
    return "#52c41a";
  };

  const riskColor = (risk) => {
    if (risk === "HIGH") return "#ff4d4f";
    if (risk === "MED") return "#faad14";
    return "#52c41a";
  };

  /* ---------- Actions ---------- */

  const exportCSV = () => {
    const rows = [
      ["ItemId", "Total", "OnRoad"],
      ...Object.entries(state).map(([itemId, item]) => [
        itemId,
        item.total ?? 0,
        item.onRoad ?? 0,
      ]),
    ];
    downloadCSV("magnum_inventory_summary.csv", rows);
  };

  if (loading) return <p style={styles.center}>Loading dashboard…</p>;

  if (!items.length) return <p style={styles.center}>No inventory data yet</p>;

  return (
   <div className="print-root" style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <h2 style={{ color: "white", margin: 0 }}>Magnum Inventory Dashboard</h2>
      </div>

      {/* SUMMARY CARDS */}
      <div style={styles.summaryGrid}>
        <SummaryCard label="Total Stock" value={totalStock} />
        <SummaryCard label="Low Stock Items" value={lowStockCount} />
        <SummaryCard label="On The Road" value={onRoad} />
        <SummaryCard label="Total Items" value={items.length} />
      </div>

      {/* DAY 6 PANELS */}
      <div className="print-section" style={styles.panels}>

        {/* Alerts */}
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>⚠ Alerts</h3>

          {alerts.critical.length === 0 && alerts.low.length === 0 ? (
            <p style={styles.muted}>No low-stock alerts.</p>
          ) : (
            <>
              {alerts.critical.length > 0 && (
                <>
                  <p style={styles.critical}>Critical</p>
                  {alerts.critical.slice(0, 5).map((a) => (
                    <div key={a.itemId} style={styles.row}>
                      <strong>{a.itemId}</strong>
                      <span>{a.total}</span>
                    </div>
                  ))}
                </>
              )}

              {alerts.low.length > 0 && (
                <>
                  <p style={styles.low}>Low</p>
                  {alerts.low.slice(0, 5).map((a) => (
                    <div key={a.itemId} style={styles.row}>
                      <strong>{a.itemId}</strong>
                      <span>{a.total}</span>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Fast movers */}
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>🚀 Fast movers (30 days)</h3>
          {fastMovers.length === 0 ? (
            <p style={styles.muted}>No delivery activity in last 30 days.</p>
          ) : (
            fastMovers.map((m) => (
              <div key={m.itemId} style={styles.row}>
                <strong>{m.itemId}</strong>
                <span>{m.deliveredLastDays}</span>
              </div>
            ))
          )}
        </div>

        {/* Reorder risk */}
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>📉 Reorder Risk</h3>
          {reorder.length === 0 ? (
            <p style={styles.muted}>No reorder data yet.</p>
          ) : (
            reorder.slice(0, 5).map((r) => (
              <div key={r.itemId} style={styles.row}>
                <strong>{r.itemId}</strong>
                <span
                  style={{
                    ...styles.riskPill,
                    background: riskColor(r.risk),
                  }}
                >
                  {r.risk}
                </span>
              </div>
            ))
          )}
          <p style={styles.helper}>
            Risk uses the last 30 days delivery rate to estimate how soon stock
            could run out.
          </p>
        </div>
      </div>

      {/* CONTROLS: Search + filters + actions */}
      <div style={styles.controls}>
        <input
          style={styles.search}
          placeholder="Search item (e.g. ITM-0001)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          style={styles.select}
          value={filterLoc}
          onChange={(e) => setFilterLoc(e.target.value)}
        >
          <option value="ALL">All locations</option>
          {allLocations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(e) => setLowOnly(e.target.checked)}
          />
          Low stock only
        </label>

        <button style={styles.actionBtn} onClick={exportCSV}>
          Export CSV
        </button>

        <button style={styles.actionBtn} onClick={() => window.print()}>
          Print
        </button>

        {/* Dev only */}
        <button
          style={{ ...styles.actionBtn, borderColor: "#0d6efd" }}
          onClick={async () => {
            await seedInventoryData();
            fetchData();
          }}
        >
          Seed Dummy Data
        </button>
      </div>

      {/* ITEM CARDS */}
      <div className="print-section" style={styles.grid}>

        {filteredEntries.map(([itemId, item]) => (
          <div key={itemId} className="print-card" style={styles.card}>

            <div style={styles.cardHeader}>
              <h3 style={{ margin: 0 }}>{itemId}</h3>

              <span
                style={{
                  ...styles.badge,
                  background: healthColor(Number(item.total) || 0),
                }}
              >
                {item.total}
              </span>
            </div>

            <p style={styles.meta}>On road: {item.onRoad || 0}</p>

            <div style={styles.locationWrap}>
              {Object.entries(item.locations || {}).map(([loc, qty]) => (
                <span key={loc} style={styles.locationTag}>
                  {loc}: {qty}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* If filter yields nothing */}
      {filteredEntries.length === 0 && (
        <p style={styles.center}>No items match your filters.</p>
      )}
    </div>
  );
}

/* ---------- Components ---------- */

function SummaryCard({ label, value }) {
  return (
    <div style={styles.summaryCard}>
      <p style={styles.summaryLabel}>{label}</p>
      <h2 style={styles.summaryValue}>{value}</h2>
    </div>
  );
}

/* ---------- STYLES ---------- */

const styles = {
  page: {
    background: "#f5f7fb",
    minHeight: "100vh",
    fontFamily: "system-ui",
  },

  header: {
    background: "#0d6efd",
    padding: "18px 24px",
    marginBottom: 18,
  },

  center: {
    textAlign: "center",
    padding: 28,
    color: "#333",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 16,
    padding: "0 20px 18px",
  },

  summaryCard: {
    background: "white",
    padding: 18,
    borderRadius: 12,
    boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
    textAlign: "center",
  },

  summaryLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
  },

  summaryValue: {
    color: "#0d6efd",
    fontSize: 26,
    margin: 0,
  },

  panels: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
    padding: "0 20px 14px",
  },

  panel: {
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 6px 14px rgba(0,0,0,0.07)",
    padding: 14,
  },

  panelTitle: { margin: "0 0 10px 0" },

  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #f0f0f0",
  },

  muted: { color: "#666", fontSize: 13 },

  critical: { color: "#ff4d4f", fontWeight: 800, margin: "8px 0 4px" },
  low: { color: "#faad14", fontWeight: 800, margin: "8px 0 4px" },

  riskPill: {
    color: "#fff",
    fontWeight: 800,
    padding: "2px 10px",
    borderRadius: 999,
    fontSize: 12,
  },

  helper: {
    fontSize: 12,
    color: "#666",
    marginTop: 10,
    lineHeight: 1.4,
  },

  controls: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    padding: "0 20px 16px",
    alignItems: "center",
  },

  search: {
    flex: "1 1 240px",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #d0d7de",
  },

  select: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #d0d7de",
    background: "#fff",
  },

  checkbox: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontSize: 13,
    color: "#333",
  },

  actionBtn: {
    background: "#fff",
    color: "#0d6efd",
    border: "1px solid #d0d7de",
    padding: "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 700,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
    padding: 20,
  },

  card: {
    background: "white",
    padding: 16,
    borderRadius: 12,
    boxShadow: "0 6px 14px rgba(0,0,0,0.07)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  badge: {
    color: "white",
    padding: "4px 10px",
    borderRadius: 8,
    fontWeight: 800,
  },

  meta: {
    fontSize: 13,
    color: "#555",
    marginBottom: 8,
  },

  locationWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },

  locationTag: {
    background: "#e7f1ff",
    color: "#0d6efd",
    padding: "4px 8px",
    borderRadius: 8,
    fontSize: 12,
  },
};
