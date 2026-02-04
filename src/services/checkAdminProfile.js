import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";

export async function checkAdminProfile(uid) {
  if (!uid) return { exists: false, data: null, error: "No UID provided" };

  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return { exists: false, data: null, error: null };

    return { exists: true, data: snap.data(), error: null };
  } catch (e) {
    return { exists: false, data: null, error: e.message };
  }
}
