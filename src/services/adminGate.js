import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";

export async function isCurrentUserAdmin(user) {
  try {
    if (!user) {
      console.log("[adminGate] No user");
      return false;
    }

    console.log("[adminGate] Checking user:", {
      uid: user.uid,
      email: user.email,
      isAnonymous: user.isAnonymous,
    });

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      console.log("[adminGate] No users doc for uid:", user.uid);
      return false;
    }

    const data = snap.data();
    console.log("[adminGate] users doc:", data);

    const isAdmin = data.role === "admin" && data.active === true;
    console.log("[adminGate] isAdmin:", isAdmin);

    return isAdmin;
  } catch (e) {
    console.error("[adminGate] error:", e);
    return false;
  }
}
