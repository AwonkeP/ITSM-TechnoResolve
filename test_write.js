import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
    const creds = await signInWithEmailAndPassword(auth, "Tatiavumile@gmail.com", "Password123!");
    console.log("Logged in as", creds.user.uid);
    
    await setDoc(doc(db, "users", creds.user.uid), { test: "data" }, { merge: true });
    console.log("Write successful");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}
run();
