import { useState, useEffect } from 'react';
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import useAuth from './useAuth';

const MAX_HISTORY_ITEMS = 50;
const HISTORY_COLLECTION = 'users';
const HISTORY_SUBCOLLECTION = 'searchHistory';

/**
 * Custom hook to sync search history from Firestore in real-time
 *
 * @returns {Object} History state
 * @property {string[]} history - Array of search queries (most recent first)
 * @property {boolean} loading - Whether initial load is in progress
 * @property {string|null} error - Error message if any
 *
 * @example
 * function SearchBar() {
 *   const { history, loading } = useFirestoreHistory();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {history.map(q => <div key={q}>{q}</div>)}
 *     </div>
 *   );
 * }
 */
export default function useFirestoreHistory() {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // If no user, return empty history
        if (!user) {
            setHistory([]);
            setLoading(false);
            return;
        }

        // Setup real-time listener
        const historyRef = collection(
            db,
            HISTORY_COLLECTION,
            user.uid,
            HISTORY_SUBCOLLECTION
        );

        const q = query(
            historyRef,
            orderBy('timestamp', 'desc'),
            limit(MAX_HISTORY_ITEMS)
        );

        // Subscribe to real-time updates
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const queries = [];
                snapshot.forEach((doc) => {
                    queries.push(doc.data().query);
                });

                setHistory(queries);
                setLoading(false);
                setError(null);

                console.log(`📋 History synced: ${queries.length} items`);
            },
            (err) => {
                console.error('❌ Firestore listener error:', err);
                setError('Không thể đồng bộ lịch sử');
                setLoading(false);
            }
        );

        // Cleanup listener on unmount or user change
        return () => {
            console.log('🧹 Cleaning up Firestore listener');
            unsubscribe();
        };
    }, [user]);

    return { history, loading, error };
}