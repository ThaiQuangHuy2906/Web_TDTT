import React, { createContext, useState, useEffect, useMemo } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase/config';

// Create context
export const AuthContext = createContext(null);

// Firebase error messages in Vietnamese
const errorMessages = {
    'auth/email-already-in-use': 'Email này đã được sử dụng',
    'auth/invalid-email': 'Email không hợp lệ',
    'auth/operation-not-allowed': 'Phương thức đăng nhập chưa được kích hoạt',
    'auth/weak-password': 'Mật khẩu quá yếu (tối thiểu 6 ký tự)',
    'auth/user-disabled': 'Tài khoản đã bị vô hiệu hóa',
    'auth/user-not-found': 'Không tìm thấy tài khoản với email này',
    'auth/wrong-password': 'Sai mật khẩu',
    'auth/too-many-requests': 'Quá nhiều lần thử. Vui lòng thử lại sau',
    'auth/network-request-failed': 'Lỗi kết nối mạng. Kiểm tra internet của bạn',
    'auth/invalid-credential': 'Thông tin đăng nhập không hợp lệ',
    'auth/missing-password': 'Vui lòng nhập mật khẩu',
};

// Helper function to translate Firebase errors
function translateError(errorCode) {
    return errorMessages[errorCode] || 'Đã xảy ra lỗi. Vui lòng thử lại';
}

// AuthProvider component
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Initial auth check
    const [error, setError] = useState(null);

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false); // Auth check complete
        });

        // Cleanup subscription on unmount
        return unsubscribe;
    }, []);

    // Signup function
    const signup = async (email, password) => {
        try {
            setError(null);
            const result = await createUserWithEmailAndPassword(auth, email, password);
            return result;
        } catch (err) {
            const errorMsg = translateError(err.code);
            setError(errorMsg);
            throw new Error(errorMsg);
        }
    };

    // Login function
    const login = async (email, password) => {
        try {
            setError(null);
            const result = await signInWithEmailAndPassword(auth, email, password);
            return result;
        } catch (err) {
            const errorMsg = translateError(err.code);
            setError(errorMsg);
            throw new Error(errorMsg);
        }
    };

    // Logout function
    const logout = async () => {
        try {
            setError(null);
            await signOut(auth);
        } catch (err) {
            const errorMsg = translateError(err.code);
            setError(errorMsg);
            throw new Error(errorMsg);
        }
    };

    // Password reset function
    const resetPassword = async (email) => {
        try {
            setError(null);
            await sendPasswordResetEmail(auth, email);
        } catch (err) {
            const errorMsg = translateError(err.code);
            setError(errorMsg);
            throw new Error(errorMsg);
        }
    };

    // Clear error function
    const clearError = () => setError(null);

    // Memoize context value to prevent unnecessary re-renders
    const value = useMemo(
        () => ({
            user,
            loading,
            error,
            signup,
            login,
            logout,
            resetPassword,
            clearError,
        }),
        [user, loading, error]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}