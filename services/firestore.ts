import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, getDoc } from 'firebase/firestore';
import { ApiRequest, Collection, Environment } from '../types';

export const FirestoreService = {
    async saveHistory(userId: string, history: ApiRequest[]) {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { history }, { merge: true });
    },

    async getHistory(userId: string): Promise<ApiRequest[]> {
        const userRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists() && docSnap.data().history) {
            return docSnap.data().history;
        }
        return [];
    },

    async saveCollection(userId: string, collectionData: Collection) {
        const colRef = doc(db, 'users', userId, 'collections', collectionData.id);
        await setDoc(colRef, collectionData);
    },

    async getCollections(userId: string): Promise<Collection[]> {
        const colRef = collection(db, 'users', userId, 'collections');
        const snapshot = await getDocs(colRef);
        return snapshot.docs.map(doc => doc.data() as Collection);
    },

    async deleteCollection(userId: string, collectionId: string) {
        const colRef = doc(db, 'users', userId, 'collections', collectionId);
        await deleteDoc(colRef);
    },

    async saveEnvironment(userId: string, environment: Environment) {
        const envRef = doc(db, 'users', userId, 'environments', environment.id);
        await setDoc(envRef, environment);
    },

    async getEnvironments(userId: string): Promise<Environment[]> {
        const envRef = collection(db, 'users', userId, 'environments');
        const snapshot = await getDocs(envRef);
        return snapshot.docs.map(doc => doc.data() as Environment);
    },

    async deleteEnvironment(userId: string, environmentId: string) {
        const envRef = doc(db, 'users', userId, 'environments', environmentId);
        await deleteDoc(envRef);
    }
};
