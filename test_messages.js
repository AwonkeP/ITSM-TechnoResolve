import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { readFileSync } from "fs";

const config = JSON.parse(readFileSync("firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  try {
    const q = query(collection(db, "messages"), where('ticket_requester_id', '==', 'test'), where('internal', '==', false));
    await getDocs(q);
    console.log("Query works");
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
check();
