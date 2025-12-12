import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Custom hook to access authentication context
 *
 * @returns {Object} Auth context value
 * @property {Object|null} user - Current authenticated user
 * @property {boolean} loading - Whether auth state is being checked
 * @property {string|null} error - Current error message
 * @property {Function} signup - Sign up with email/password
 * @property {Function} login - Log in with email/password
 * @property {Function} logout - Log out current user
 * @property {Function} resetPassword - Send password reset email
 * @property {Function} clearError - Clear current error
 *
 * @throws {Error} If used outside AuthProvider
 *
 * @example
 * function MyComponent() {
 *   const { user, login, logout } = useAuth();
 *
 *   if (!user) {
 *     return <button onClick={() => login(email, pwd)}>Login</button>
 *   }
 *
 *   return <button onClick={logout}>Logout</button>
 * }
 */
export default function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            'useAuth must be used within an AuthProvider. ' +
            'Make sure your component is wrapped with <AuthProvider>.'
        );
    }

    return context;
}