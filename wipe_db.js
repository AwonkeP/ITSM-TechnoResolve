import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { readFileSync } from "fs";

const config = JSON.parse(readFileSync("firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app);

const COLLECTIONS = ["users", "tickets", "messages", "notifications", "outbox"];

async function wipe() {
  for (const col of COLLECTIONS) {
    const colRef = collection(db, col);
    const snap = await getDocs(colRef);
    console.log(`Deleting ${snap.size} docs from ${col}...`);
    for (const d of snap.docs) {
      await deleteDoc(doc(db, col, d.id));
    }
  }
  console.log("Done wiping.");
  process.exit(0);
}

wipe().catch(err => {
  console.error(err);
  process.exit(1);
});
