import { initializeApp } from "firebase/app";
import { getFirestore, deleteDoc, doc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  try {
    const targetId = "BcdaB3xtsiXZp1AdMpU3eHN43g32";
    console.log("Deleting user directly:", targetId);
    await deleteDoc(doc(db, "users", targetId));
    console.log("Done");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}
run();
