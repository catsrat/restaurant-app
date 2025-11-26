"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check active sessions and sets the user
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        };

        getSession();

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string) => {
        // For this app, we'll use Magic Link for simplicity and security, 
        // or we can use password if preferred. The plan mentioned Email/Password.
        // Let's stick to Email/Password as it's more standard for "Admin" accounts usually.
        // However, the user might not have set up passwords. 
        // Let's implement a generic signInWithPassword.
        // Wait, the plan said "Login/Signup". Let's assume existing users or allow signup?
        // Usually admin apps are invite-only. 
        // Let's implement signInWithPassword.

        // Actually, for a quick start, let's just use signInWithPassword.
        // But wait, I need to know if I should implement signup too.
        // The plan said "Setup Login/Signup Pages". 
        // I'll implement a simple login that can also be used for signup if needed, 
        // or just login. Let's stick to Login for now to keep it simple.

        // Wait, I need to pass password too.
        return { error: new Error("Use the direct supabase method for now") };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const value = {
        user,
        session,
        loading,
        signIn, // We will use direct supabase calls in the component for flexibility
        signOut
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
