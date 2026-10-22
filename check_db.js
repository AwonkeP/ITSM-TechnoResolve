import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { readFileSync } from "fs";

const config = JSON.parse(readFileSync("firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  const users = await getDocs(collection(db, "users"));
  console.log(`Total users: ${users.size}`);
  users.forEach(doc => console.log(doc.id, doc.data()));
  process.exit(0);
}
check();
