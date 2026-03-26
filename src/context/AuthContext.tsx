// context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  preferences?: any;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null; user?: User }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any | null; data: any; message?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null }>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error: any | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  // Refresh profile
  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const profileData = await fetchProfile(currentUser.id);
        setProfile(profileData);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const profileData = await fetchProfile(currentUser.id);
        setProfile(profileData);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('Sign in error:', error);
        return { error, user: undefined };
      }
      
      // Update last_login in user_profiles
      if (data.user) {
        await supabase
          .from('user_profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('user_id', data.user.id);
        
        // Refresh profile
        const profileData = await fetchProfile(data.user.id);
        setProfile(profileData);
      }
      
      return { error: null, user: data.user };
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      return { error, user: undefined };
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      // Attempt sign up
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: userData?.full_name,
            phone: userData?.phone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error('Sign up error details:', error);
        
        if (error.message.includes('already registered')) {
          return { 
            data: null, 
            error,
            message: 'Email already registered. Please sign in instead.'
          };
        }
        
        return { data: null, error, message: error.message };
      }
      
      // If sign up successful
      if (data.user) {
        // The trigger should automatically create the profile
        // But let's wait a moment and then fetch it
        setTimeout(async () => {
          const profileData = await fetchProfile(data.user!.id);
          setProfile(profileData);
        }, 1000);
        
        return { 
          data, 
          error: null, 
          message: 'Account created successfully! Please check your email to confirm.'
        };
      }
      
      return { data, error: null, message: 'Please check your email to confirm your account.' };
    } catch (error: any) {
      console.error('Unexpected sign up error:', error);
      return { 
        data: null, 
        error,
        message: error.message || 'An unexpected error occurred. Please try again.'
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') };
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(data)
        .eq('user_id', user.id);
      
      if (!error) {
        await refreshProfile();
      }
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      resetPassword,
      updateProfile,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};