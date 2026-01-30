import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebaseConfig/firebase";

export default function InventoryEventForm({ items, locations }) {
  const [itemId, setItemId] = useState("");
  const [eventType, setEventType] = useState("RECEIVE");
  const [quantity, setQuantity] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [note, setNote] = useState("");

  const EVENT_TYPES = ["RECEIVE", "MOVE", "DELIVER", "RETURN"];
  const requiresFrom = ["MOVE", "DELIVER"];
  const requiresTo = ["RECEIVE", "MOVE", "RETURN"];

  // Validation function
  const validateEvent = () => {
    if (!itemId) {
      alert("Please select an item.");
      return false;
    }

    if (!eventType) {
      alert("Please select an event type.");
      return false;
    }

    if (!quantity || quantity <= 0) {
      alert("Quantity must be greater than zero.");
      return false;
    }

    if (requiresFrom.includes(eventType) && !fromLocation) {
      alert("Please select a 'From' location.");
      return false;
    }

    if (requiresTo.includes(eventType) && !toLocation) {
      alert("Please select a 'To' location.");
      return false;
    }

    if (fromLocation && toLocation && fromLocation === toLocation) {
      alert("'From' and 'To' locations cannot be the same.");
      return false;
    }

    return true;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEvent()) return;

    // Determine quantity sign
    let qty = Number(quantity);
    if (["MOVE", "DELIVER"].includes(eventType)) qty = -Math.abs(qty);
    if (["RECEIVE", "RETURN"].includes(eventType)) qty = Math.abs(qty);

    // Construct event object
    const event = {
      itemId,
      eventType,
      quantity: qty,
      fromLocation: fromLocation || null,
      toLocation: toLocation || null,
      timestamp: serverTimestamp(),
      performedBy: auth.currentUser.email,
      note: note || "",
      reference: "" // optional, extendable
    };

    try {
      await addDoc(collection(db, "inventoryEvents"), event);

      // Reset form
      setItemId("");
      setEventType("RECEIVE");
      setQuantity("");
      setFromLocation("");
      setToLocation("");
      setNote("");

      alert("Event logged successfully!");
    } catch (err) {
      console.error("Firestore write error:", err);
      alert("Error logging event. Try again.");
    }
  };

  // Disable button if required fields not filled
  const isDisabled = !itemId || !quantity ||
    (requiresFrom.includes(eventType) && !fromLocation) ||
    (requiresTo.includes(eventType) && !toLocation);

  return (
    <form style={{ maxWidth: 500, margin: "auto" }} onSubmit={handleSubmit}>
      <h3>Inventory Event Logger</h3>

      {/* Item */}
      <label>Item</label>
      <select value={itemId} onChange={e => setItemId(e.target.value)}>
        <option value="">Select item</option>
        {items.map(item => (
          <option key={item.itemId} value={item.itemId}>
            {item.name}
          </option>
        ))}
      </select>

      {/* Event Type */}
      <label>Event Type</label>
      <select value={eventType} onChange={e => setEventType(e.target.value)}>
        {EVENT_TYPES.map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>

      {/* Quantity */}
      <label>Quantity</label>
      <input
        type="number"
        min="1"
        value={quantity}
        onChange={e => setQuantity(e.target.value)}
      />

      {/* From Location */}
      {requiresFrom.includes(eventType) && (
        <>
          <label>From Location</label>
          <select value={fromLocation} onChange={e => setFromLocation(e.target.value)}>
            <option value="">Select location</option>
            {locations.map(loc => (
              <option key={loc.locationId} value={loc.locationId}>
                {loc.name}
              </option>
            ))}
          </select>
        </>
      )}

      {/* To Location */}
      {requiresTo.includes(eventType) && (
        <>
          <label>To Location</label>
          <select value={toLocation} onChange={e => setToLocation(e.target.value)}>
            <option value="">Select location</option>
            {locations.map(loc => (
              <option key={loc.locationId} value={loc.locationId}>
                {loc.name}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Optional Note */}
      <label>Note (optional)</label>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
      />

      {/* Helper Text */}
      <p style={{ fontSize: 12, color: "#555" }}>
        {eventType === "RECEIVE" && "Stock is coming in from supplier."}
        {eventType === "MOVE" && "Move stock internally between locations."}
        {eventType === "DELIVER" && "Deliver stock to client/site."}
        {eventType === "RETURN" && "Stock returned from client or site."}
      </p>

      <button type="submit" disabled={isDisabled}>Log Event</button>
    </form>
  );
}
