// src/services/seedInventoryData.js

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";

export async function seedInventoryData() {
  const events = [
    // ITM-0001 (healthy)
    {
      itemId: "ITM-0001",
      type: "RECEIVE",
      quantity: 120,
      toLocation: "LOC-AECI",
      note: "Initial stock"
    },
    {
      itemId: "ITM-0001",
      type: "MOVE",
      quantity: 30,
      fromLocation: "LOC-AECI",
      toLocation: "LOC-OFFICE",
      note: "Office transfer"
    },
    {
      itemId: "ITM-0001",
      type: "DELIVER",
      quantity: 10,
      fromLocation: "LOC-OFFICE",
      note: "Client delivery"
    },
    {
      itemId: "ITM-0001",
      type: "RETURN",
      quantity: 5,
      toLocation: "LOC-OFFICE",
      note: "Returned stock"
    },

    // ITM-0002 (medium)
    {
      itemId: "ITM-0002",
      type: "RECEIVE",
      quantity: 25,
      toLocation: "LOC-AECI"
    },
    {
      itemId: "ITM-0002",
      type: "DELIVER",
      quantity: 8,
      fromLocation: "LOC-AECI"
    },

    // ITM-0003 (low)
    {
      itemId: "ITM-0003",
      type: "RECEIVE",
      quantity: 10,
      toLocation: "LOC-AECI"
    },
    {
      itemId: "ITM-0003",
      type: "DELIVER",
      quantity: 7,
      fromLocation: "LOC-AECI"
    }
  ];

  try {
    for (const e of events) {
      await addDoc(collection(db, "inventoryEvents"), {
        ...e,
        createdAt: serverTimestamp()
      });
    }

    alert("Dummy inventory events seeded successfully ✅");
  } catch (err) {
    console.error(err);
    alert("Seeding failed ❌");
  }
}
