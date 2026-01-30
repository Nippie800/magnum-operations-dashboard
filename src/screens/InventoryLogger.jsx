import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebaseConfig/firebase";

export default function InventoryLogger() {
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);

  const [authStatus, setAuthStatus] = useState("checking"); // checking | signed_in | error
  const [loadStatus, setLoadStatus] = useState("idle"); // idle | loading | ready | empty | denied | error
  const [error, setError] = useState("");

  const [itemId, setItemId] = useState("");
  const [eventType, setEventType] = useState("RECEIVE");
  const [quantity, setQuantity] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [note, setNote] = useState("");

  const requiresFrom = useMemo(() => ["MOVE", "DELIVER"], []);
  const requiresTo = useMemo(() => ["RECEIVE", "MOVE", "RETURN"], []);

  const eventHints = {
    RECEIVE: "Stock arriving from a supplier.",
    MOVE: "Move stock between internal locations.",
    DELIVER: "Stock leaving for a client or site.",
    RETURN: "Stock coming back from a client or site.",
  };

  // ---------- Helpers ----------
  const mapSnap = (snap) =>
    snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      displayName: doc.data()?.name || doc.id,
    }));

  const resetDependentFields = (nextType) => {
    // If switching away from MOVE/DELIVER, clear fromLocation
    if (!requiresFrom.includes(nextType)) setFromLocation("");
    // If switching away from RECEIVE/MOVE/RETURN, clear toLocation
    if (!requiresTo.includes(nextType)) setToLocation("");
  };

  const loadReferenceData = async () => {
    setLoadStatus("loading");
    setError("");

    try {
      const [itemsSnap, locSnap] = await Promise.all([
        getDocs(collection(db, "items")),
        getDocs(collection(db, "locations")),
      ]);

      const itemsData = mapSnap(itemsSnap);
      const locData = mapSnap(locSnap);

      setItems(itemsData);
      setLocations(locData);

      if (itemsData.length === 0 && locData.length === 0) {
        setLoadStatus("empty");
      } else {
        setLoadStatus("ready");
      }
    } catch (err) {
      console.error("Firestore load error:", err);

      const msg = String(err?.message || "");
      // Common Firebase permission error text
      if (msg.toLowerCase().includes("missing or insufficient permissions")) {
        setLoadStatus("denied");
        setError(
          "Permission denied. Your Firestore rules are blocking reads for this user."
        );
      } else {
        setLoadStatus("error");
        setError("Failed to load items/locations. Check console for details.");
      }
    }
  };

  // ---------- Auth + Data bootstrap ----------
  useEffect(() => {
    setAuthStatus("checking");
    setLoadStatus("idle");
    setError("");

    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          // Auto sign-in anonymously ONLY if no user exists
          await signInAnonymously(auth);
          return; // onAuthStateChanged will fire again with the new user
        }

        setAuthStatus("signed_in");

        // Once signed in (admin or anonymous), load reference data
        await loadReferenceData();
      } catch (err) {
        console.error("Auth error:", err);
        setAuthStatus("error");
        setLoadStatus("error");
        setError("Authentication failed. Check console for details.");
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- UI state ----------
  const isDisabled =
    loadStatus !== "ready" ||
    !itemId ||
    !quantity ||
    (requiresFrom.includes(eventType) && !fromLocation) ||
    (requiresTo.includes(eventType) && !toLocation);

  // ---------- Render helpers ----------
  const renderDropdown = ({ data, value, onChange, placeholder, disabled }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={styles.select}
    >
      <option value="">{placeholder}</option>
      {data.map((d) => (
        <option key={d.id} value={d.id}>
          {d.displayName}
        </option>
      ))}
    </select>
  );

  const renderStatusBanner = () => {
    if (authStatus === "checking") return "Signing you in…";
    if (loadStatus === "loading") return "Loading items & locations…";
    if (loadStatus === "empty") return "No items/locations found in Firestore.";
    if (loadStatus === "denied") return error || "Permission denied.";
    if (loadStatus === "error") return error || "Something went wrong.";
    return null;
  };

  const bannerText = renderStatusBanner();

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Log Inventory Event</h2>

      {/* Status Banner */}
      {bannerText && (
        <div
          style={{
            ...styles.banner,
            background:
              loadStatus === "denied" || loadStatus === "error"
                ? "#ffeaea"
                : "#e7f1ff",
            color:
              loadStatus === "denied" || loadStatus === "error"
                ? "#b00020"
                : "#0d6efd",
          }}
        >
          {bannerText}
          {(loadStatus === "denied" || loadStatus === "error") && (
            <div style={{ marginTop: 8 }}>
              <button
                style={styles.smallBtn}
                onClick={loadReferenceData}
                type="button"
              >
                Retry loading
              </button>
            </div>
          )}
        </div>
      )}

      {/* ITEM */}
      <section style={styles.section}>
        <label style={styles.label}>Item</label>
        {renderDropdown({
          data: items,
          value: itemId,
          onChange: setItemId,
          placeholder:
            loadStatus === "loading" ? "Loading…" : "Select item",
          disabled: loadStatus !== "ready" || items.length === 0,
        })}
        {loadStatus === "ready" && items.length === 0 && (
          <p style={styles.helper}>
            No items found. Add docs to the <strong>items</strong> collection.
          </p>
        )}
      </section>

      {/* EVENT TYPE */}
      <section style={styles.section}>
        <label style={styles.label}>Event Type</label>
        <select
          value={eventType}
          onChange={(e) => {
            const next = e.target.value;
            setEventType(next);
            resetDependentFields(next);
          }}
          style={styles.select}
          disabled={loadStatus !== "ready"}
        >
          <option value="RECEIVE">Receiving stock</option>
          <option value="MOVE">Move stock internally</option>
          <option value="DELIVER">Deliver to client / site</option>
          <option value="RETURN">Return from client / site</option>
        </select>
        <p style={styles.helper}>{eventHints[eventType]}</p>
      </section>

      {/* QUANTITY */}
      <section style={styles.section}>
        <label style={styles.label}>Quantity</label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Enter quantity"
          style={styles.input}
          disabled={loadStatus !== "ready"}
        />
      </section>

      {/* FROM LOCATION */}
      <section style={styles.section}>
        <label style={styles.label}>From Location</label>
        {renderDropdown({
          data: locations,
          value: fromLocation,
          onChange: setFromLocation,
          placeholder:
            requiresFrom.includes(eventType)
              ? "Select source location"
              : "Not required for this event",
          disabled:
            loadStatus !== "ready" ||
            locations.length === 0 ||
            !requiresFrom.includes(eventType),
        })}
        {!requiresFrom.includes(eventType) && (
          <p style={styles.helper}>Disabled unless event is MOVE or DELIVER.</p>
        )}
      </section>

      {/* TO LOCATION */}
      <section style={styles.section}>
        <label style={styles.label}>To Location</label>
        {renderDropdown({
          data: locations,
          value: toLocation,
          onChange: setToLocation,
          placeholder:
            requiresTo.includes(eventType)
              ? "Select destination location"
              : "Not required for this event",
          disabled:
            loadStatus !== "ready" ||
            locations.length === 0 ||
            !requiresTo.includes(eventType),
        })}
        {!requiresTo.includes(eventType) && (
          <p style={styles.helper}>Disabled unless event is RECEIVE, MOVE, RETURN.</p>
        )}
      </section>

      {/* NOTE */}
      <section style={styles.section}>
        <label style={styles.label}>Notes (optional)</label>
        <textarea
          placeholder="Supplier invoice, delivery ref, job number..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={styles.textarea}
          disabled={loadStatus !== "ready"}
        />
      </section>

      {/* ACTION (hook this to your handleSubmit later) */}
      <button
        style={{ ...styles.button, opacity: isDisabled ? 0.5 : 1 }}
        disabled={isDisabled}
        type="button"
        onClick={() => alert("Next: wire this to addDoc(create event)")}
      >
        Log Event
      </button>

      {/* Debug helper */}
      <p style={{ ...styles.helper, marginTop: 10 }}>
        Auth: <strong>{auth.currentUser ? "signed in" : "not signed in"}</strong>{" "}
        ({auth.currentUser?.isAnonymous ? "anonymous" : "non-anonymous"})
      </p>
    </div>
  );
}

/* ---------- STYLES ---------- */

const styles = {
  container: {
    maxWidth: 520,
    margin: "40px auto",
    padding: 24,
    background: "#ffffff",
    borderRadius: 10,
    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
    fontFamily: "system-ui",
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
  },
  banner: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    fontSize: 13,
    lineHeight: 1.35,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    marginBottom: 14,
  },
  label: {
    fontWeight: 600,
    marginBottom: 6,
  },
  helper: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
  },
  select: {
    padding: "10px 10px",
    borderRadius: 8,
    border: "1px solid #d0d7de",
    outline: "none",
    background: "#fff",
  },
  input: {
    padding: "10px 10px",
    borderRadius: 8,
    border: "1px solid #d0d7de",
    outline: "none",
  },
  textarea: {
    padding: "10px 10px",
    borderRadius: 8,
    border: "1px solid #d0d7de",
    outline: "none",
    minHeight: 80,
    resize: "vertical",
  },
  button: {
    marginTop: 10,
    padding: "12px",
    fontWeight: 700,
    background: "#0d6efd",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  smallBtn: {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid #0d6efd",
    background: "#fff",
    color: "#0d6efd",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 12,
  },
};
