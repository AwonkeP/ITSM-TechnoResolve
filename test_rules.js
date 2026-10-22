import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, setDoc, doc, getDoc, collection, addDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
    const creds = await signInWithEmailAndPassword(auth, "tatiavumile@gmail.com", "Password123!");
    console.log("Logged in as", creds.user.uid);
    
    // Test creating a ticket
    const ticketId = "TICK-TEST";
    const ticketData = {
      id: ticketId,
      title: "Test Ticket",
      description: "Test description",
      category: "general",
      priority: "medium",
      status: "new",
      requester_id: creds.user.uid,
      requester_name: "Test User",
      requester_email: "test@example.com",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await setDoc(doc(db, "tickets", ticketId), ticketData);
    console.log("Ticket created successfully");
    
    // Test creating a message
    const msgData = {
      id: "msg-TEST",
      ticket_id: ticketId,
      ticket_requester_id: creds.user.uid,
      author_id: creds.user.uid,
      author_name: "Test User",
      author_role: "admin",
      body: "Test message",
      internal: false,
      created_at: new Date().toISOString(),
    };
    await setDoc(doc(db, "messages", "msg-TEST"), msgData);
    console.log("Message created successfully");
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}
run();
