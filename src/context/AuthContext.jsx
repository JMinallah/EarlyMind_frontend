import React, { createContext, useEffect, useState } from 'react';
import authService from '../appwrite/auth';

const AuthContext = createContext({
    user: null,
    loading: true,
    login: () => {},
    logout: () => {},
    register: () => {}
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in when the app starts
        const checkUser = async () => {
            try {
                const currentUser = await authService.getCurrentUser();
                if (currentUser) {
                    setUser(currentUser);
                }
            } catch {
                console.log('No active session');
            } finally {
                setLoading(false);
            }
        };

        checkUser();
    }, []);

    const login = async ({ email, password }) => {
        const session = await authService.login({ email, password });
        if (session) {
            const userData = await authService.getCurrentUser();
            setUser(userData);
            return { success: true };
        }
    };

    const register = async ({ email, password, name, userType }) => {
        // Create the user account with the userType passed as a parameter
        const response = await authService.createAccount({
            email,
            password,
            name,
            userType
        });
        
        // Log in the user after registration is handled inside createAccount in auth.js
        
        return response;
    };

    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
        } catch (error) {
            console.log('Logout error:', error);
        }
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;