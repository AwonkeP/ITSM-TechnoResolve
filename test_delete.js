import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, setDoc, doc, deleteDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
    const creds = await signInWithEmailAndPassword(auth, "tatiavumile@gmail.com", "Password123!");
    console.log("Logged in as", creds.user.uid);
    
    // Create a dummy user
    const dummyId = "dummy_user_123";
    await setDoc(doc(db, "users", dummyId), {
      id: dummyId,
      email: "dummy@example.com",
      full_name: "Dummy",
      role: "user",
      created_at: new Date().toISOString()
    });
    console.log("Dummy user created");
    
    // Attempt to delete it
    await deleteDoc(doc(db, "users", dummyId));
    console.log("Dummy user deleted successfully");
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}
run();
