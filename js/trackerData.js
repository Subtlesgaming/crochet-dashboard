/**
 * CRUD layer over the `inventory` and `sales` Firestore collections. Views
 * only ever call this module, never Firestore directly -- same separation
 * dataSource.js already established for the static research JSON.
 */
import { loadFirebase } from './firebaseClient.js';

async function getDb() {
  const { db, firestoreApi } = await loadFirebase();
  if (!db) throw new Error('Firebase is not configured yet -- see js/firebaseConfig.js.');
  return { db, firestoreApi };
}

async function listCollection(name, orderField) {
  const { db, firestoreApi } = await getDb();
  const q = firestoreApi.query(firestoreApi.collection(db, name), firestoreApi.orderBy(orderField, 'desc'));
  const snap = await firestoreApi.getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listInventoryItems() {
  return listCollection('inventory', 'createdAt');
}

export async function addInventoryItem(item) {
  const { db, firestoreApi } = await getDb();
  return firestoreApi.addDoc(firestoreApi.collection(db, 'inventory'), { ...item, createdAt: firestoreApi.serverTimestamp() });
}

export async function updateInventoryItem(id, patch) {
  const { db, firestoreApi } = await getDb();
  return firestoreApi.updateDoc(firestoreApi.doc(db, 'inventory', id), patch);
}

export async function deleteInventoryItem(id) {
  const { db, firestoreApi } = await getDb();
  return firestoreApi.deleteDoc(firestoreApi.doc(db, 'inventory', id));
}

export async function listSales() {
  return listCollection('sales', 'saleDate');
}

export async function addSale(sale) {
  const { db, firestoreApi } = await getDb();
  return firestoreApi.addDoc(firestoreApi.collection(db, 'sales'), { ...sale, createdAt: firestoreApi.serverTimestamp() });
}

export async function updateSale(id, patch) {
  const { db, firestoreApi } = await getDb();
  return firestoreApi.updateDoc(firestoreApi.doc(db, 'sales', id), patch);
}

export async function deleteSale(id) {
  const { db, firestoreApi } = await getDb();
  return firestoreApi.deleteDoc(firestoreApi.doc(db, 'sales', id));
}
