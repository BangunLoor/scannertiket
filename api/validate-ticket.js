import { readFile } from 'fs/promises';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(
  await readFile(new URL('../firebase-service-account.json', import.meta.url))
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  // ✅ Tambahkan CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // preflight OK
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { qr } = req.body;
    if (!qr) return res.status(400).json({ success: false, message: "QR code is missing" });

    const ticketsRef = db.collection("tickets");
    const snapshot = await ticketsRef.where("qr", "==", qr).get();

    if (snapshot.empty) {
      return res.status(404).json({ success: false, message: "Tiket tidak ditemukan." });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    if (data.hadir === true) {
      return res.status(200).json({ success: false, message: "Tiket sudah digunakan." });
    }

    await doc.ref.update({ hadir: true });
    return res.status(200).json({ success: true, message: "Tiket valid. Akses diberikan.", data });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
  }
}
