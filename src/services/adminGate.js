import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";

export async function isCurrentUserAdmin(user) {
  if (!user) return false;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  return snap.exists() && snap.data()?.role === "admin";
}
