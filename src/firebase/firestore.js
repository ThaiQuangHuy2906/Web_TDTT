import {
    collection,
    query,
    orderBy,
    limit,
    addDoc,
    deleteDoc,
    getDocs,
    where,
    serverTimestamp,
    writeBatch,
    doc,
} from 'firebase/firestore';
import { db } from './config';

// Constants
const HISTORY_COLLECTION = 'users';
const HISTORY_SUBCOLLECTION = 'searchHistory';
const MAX_HISTORY_ITEMS = 50;
const LOCALSTORAGE_KEY = 'search_history_v1';

/**
 * Get user's search history from Firestore
 * Returns array of query strings, ordered by most recent first
 *
 * @param {string} userId - User's UID
 * @returns {Promise<string[]>} Array of search queries
 */
export async function getUserHistory(userId) {
    try {
        const historyRef = collection(db, HISTORY_COLLECTION, userId, HISTORY_SUBCOLLECTION);
        const q = query(historyRef, orderBy('timestamp', 'desc'), limit(MAX_HISTORY_ITEMS));

        const snapshot = await getDocs(q);
        const history = [];

        snapshot.forEach((doc) => {
            history.push(doc.data().query);
        });

        return history;
    } catch (err) {
        console.error('Error fetching history:', err);
        throw new Error('Không thể tải lịch sử tìm kiếm');
    }
}

/**
 * Add a search query to user's history
 * Prevents duplicates - if query exists, it will be removed and re-added (moved to top)
 *
 * @param {string} userId - User's UID
 * @param {string} query - Search query string
 * @returns {Promise<void>}
 */
export async function addToHistory(userId, query) {
    const trimmedQuery = (query || '').trim();
    if (!trimmedQuery) return;

    try {
        // First, remove existing entry if it exists (to avoid duplicates)
        await removeFromHistory(userId, trimmedQuery, true); // silent = true

        // Then add new entry
        const historyRef = collection(db, HISTORY_COLLECTION, userId, HISTORY_SUBCOLLECTION);
        await addDoc(historyRef, {
            query: trimmedQuery,
            timestamp: serverTimestamp(),
            createdAt: new Date(), // Fallback for offline
        });

        console.log('✅ Added to history:', trimmedQuery);
    } catch (err) {
        console.error('Error adding to history:', err);
        throw new Error('Không thể lưu lịch sử tìm kiếm');
    }
}

/**
 * Remove a specific query from user's history
 *
 * @param {string} userId - User's UID
 * @param {string} query - Search query to remove
 * @param {boolean} silent - If true, don't throw errors (used internally)
 * @returns {Promise<void>}
 */
export async function removeFromHistory(userId, query, silent = false) {
    const trimmedQuery = (query || '').trim();
    if (!trimmedQuery) return;

    try {
        const historyRef = collection(db, HISTORY_COLLECTION, userId, HISTORY_SUBCOLLECTION);
        const q = query(historyRef, where('query', '==', trimmedQuery));
        const snapshot = await getDocs(q);

        // Delete all matching documents (should be 0 or 1)
        const deletePromises = [];
        snapshot.forEach((docSnap) => {
            deletePromises.push(deleteDoc(docSnap.ref));
        });

        await Promise.all(deletePromises);

        if (!silent && deletePromises.length > 0) {
            console.log('✅ Removed from history:', trimmedQuery);
        }
    } catch (err) {
        if (!silent) {
            console.error('Error removing from history:', err);
            throw new Error('Không thể xóa lịch sử tìm kiếm');
        }
    }
}

/**
 * Clear all search history for a user
 *
 * @param {string} userId - User's UID
 * @returns {Promise<void>}
 */
export async function clearHistory(userId) {
    try {
        const historyRef = collection(db, HISTORY_COLLECTION, userId, HISTORY_SUBCOLLECTION);
        const snapshot = await getDocs(historyRef);

        // Use batch for better performance
        const batch = writeBatch(db);
        snapshot.forEach((docSnap) => {
            batch.delete(docSnap.ref);
        });

        await batch.commit();
        console.log('✅ History cleared');
    } catch (err) {
        console.error('Error clearing history:', err);
        throw new Error('Không thể xóa lịch sử tìm kiếm');
    }
}

/**
 * Migrate localStorage history to Firestore
 * Called once after user signs up or logs in for the first time
 * Merges with existing Firestore data (if any)
 *
 * @param {string} userId - User's UID
 * @returns {Promise<void>}
 */
export async function migrateLocalStorageHistory(userId) {
    try {
        // Read from localStorage
        const raw = localStorage.getItem(LOCALSTORAGE_KEY);
        if (!raw) {
            console.log('ℹ️ No localStorage history to migrate');
            return;
        }

        let localHistory = [];
        try {
            localHistory = JSON.parse(raw);
            if (!Array.isArray(localHistory)) localHistory = [];
        } catch {
            console.warn('⚠️ Invalid localStorage history format');
            return;
        }

        if (localHistory.length === 0) {
            console.log('ℹ️ No localStorage history to migrate');
            return;
        }

        // Get existing Firestore history
        const existingHistory = await getUserHistory(userId);
        const existingSet = new Set(existingHistory);

        // Filter out duplicates
        const uniqueToMigrate = localHistory.filter(q => !existingSet.has(q));

        if (uniqueToMigrate.length === 0) {
            console.log('ℹ️ All localStorage history already in Firestore');
            // Clear localStorage after successful migration
            localStorage.removeItem(LOCALSTORAGE_KEY);
            return;
        }

        // Batch add to Firestore
        const historyRef = collection(db, HISTORY_COLLECTION, userId, HISTORY_SUBCOLLECTION);
        const batch = writeBatch(db);

        uniqueToMigrate.forEach((query) => {
            const docRef = doc(historyRef);
            batch.set(docRef, {
                query,
                timestamp: serverTimestamp(),
                createdAt: new Date(),
                migrated: true, // Flag to indicate this was migrated
            });
        });

        await batch.commit();
        console.log(`✅ Migrated ${uniqueToMigrate.length} items from localStorage`);

        // Clear localStorage after successful migration
        localStorage.removeItem(LOCALSTORAGE_KEY);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        // Don't throw - migration is non-critical
        // Keep localStorage as fallback
    }
}