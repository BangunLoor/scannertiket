import admin from 'firebase-admin';
import serviceAccount from '../../firebase-service-account.json' assert { type: 'json' };

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { qr } = req.body;
  if (!qr) return res.status(400).json({ valid: false, error: "QR kosong" });

  try {
    const snapshot = await db.collection('tickets').where('qr', '==', qr).get();
    if (snapshot.empty) {
      return res.status(200).json({ valid: false });
    }

    const doc = snapshot.docs[0];
    await doc.ref.update({ hadir: true });

    const data = doc.data();
    res.status(200).json({
      valid: true,
      name: data.name,
      email: data.email,
      hadir: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ valid: false, error: err.message });
  }
}
