import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, serverTimestamp,
  getDoc, setDoc, where
} from 'firebase/firestore';
import { db } from '../firebase';

// ── Firestore path helpers ────────────────────────────────────────────────────
// All shared data now lives under workspaces/{workspaceId}/...
// User→workspace mapping lives under userProfiles/{uid}

const wsCol = (wsId, col) => collection(db, 'workspaces', wsId, col);
const wsDoc = (wsId, col, id) => doc(db, 'workspaces', wsId, col, id);

// ── WORKSPACE MANAGEMENT ─────────────────────────────────────────────────────

// Generate a random 6-char uppercase invite code
function genCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Look up which workspace a user belongs to
export async function getUserWorkspace(uid) {
  const ref  = doc(db, 'userProfiles', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data().workspaceId || null;
}

// Create a new workspace, register the creator, return workspaceId
export async function createWorkspace(uid, displayName) {
  const inviteCode = genCode();
  const wsRef = doc(collection(db, 'workspaces')); // auto-id
  await setDoc(wsRef, {
    createdBy:   uid,
    members:     [uid],
    memberNames: { [uid]: displayName || 'You' },
    inviteCode,
    createdAt:   serverTimestamp(),
  });
  // Register user → workspace mapping
  await setDoc(doc(db, 'userProfiles', uid), {
    workspaceId: wsRef.id,
    joinedAt:    serverTimestamp(),
  });
  return wsRef.id;
}

// Join an existing workspace by invite code
export async function joinWorkspace(uid, displayName, inviteCode) {
  const upper = inviteCode.trim().toUpperCase();
  // Find workspace with this code
  const q    = query(collection(db, 'workspaces'), where('inviteCode', '==', upper));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('Invalid invite code. Check with your lantern partner.');

  const wsDoc2 = snap.docs[0];
  const wsId   = wsDoc2.id;
  const data   = wsDoc2.data();

  if (data.members.includes(uid)) {
    // Already a member — just ensure userProfile is set
    await setDoc(doc(db, 'userProfiles', uid), { workspaceId: wsId, joinedAt: serverTimestamp() });
    return wsId;
  }

  // Add user to workspace members
  const updatedNames = { ...(data.memberNames || {}), [uid]: displayName || 'Partner' };
  await updateDoc(doc(db, 'workspaces', wsId), {
    members:     [...data.members, uid],
    memberNames: updatedNames,
  });
  // Register user → workspace mapping
  await setDoc(doc(db, 'userProfiles', uid), {
    workspaceId: wsId,
    joinedAt:    serverTimestamp(),
  });
  return wsId;
}

// Get workspace info (members, invite code)
export async function getWorkspaceInfo(wsId) {
  const snap = await getDoc(doc(db, 'workspaces', wsId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ── PLACES ───────────────────────────────────────────────────────────────────

export async function getPlaces(wsId) {
  const q = query(wsCol(wsId, 'places'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addPlace(wsId, place) {
  return addDoc(wsCol(wsId, 'places'), {
    ...place,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updatePlace(wsId, id, data) {
  return updateDoc(wsDoc(wsId, 'places', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePlace(wsId, id) {
  return deleteDoc(wsDoc(wsId, 'places', id));
}

// ── PEOPLE ───────────────────────────────────────────────────────────────────

export async function getPeople(wsId) {
  const q = query(wsCol(wsId, 'people'), orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addPerson(wsId, person) {
  return addDoc(wsCol(wsId, 'people'), {
    ...person,
    createdAt: serverTimestamp(),
  });
}

export async function updatePerson(wsId, id, data) {
  return updateDoc(wsDoc(wsId, 'people', id), data);
}

export async function deletePerson(wsId, id) {
  return deleteDoc(wsDoc(wsId, 'people', id));
}

// ── TRIPS ────────────────────────────────────────────────────────────────────

export async function getTrips(wsId) {
  const q = query(wsCol(wsId, 'trips'), orderBy('startDate', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addTrip(wsId, trip) {
  return addDoc(wsCol(wsId, 'trips'), {
    ...trip,
    createdAt: serverTimestamp(),
  });
}

export async function updateTrip(wsId, id, data) {
  return updateDoc(wsDoc(wsId, 'trips', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTrip(wsId, id) {
  return deleteDoc(wsDoc(wsId, 'trips', id));
}
