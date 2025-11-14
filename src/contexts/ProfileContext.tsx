'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { supabase } from '@/src/lib/supabase/client';

interface ProfileContextType {
  profileId: string | null;
  role: string | null;
  isAdmin: boolean;
  isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getProfileId() {
      if (!user) {
        setProfileId(null);
        setRole(null);
        setIsLoading(false);
        return;
      }
      
      // Check if we already have it cached in sessionStorage
      const cachedProfileId = sessionStorage.getItem(`profile_${user.id}`);
      const cachedRole = sessionStorage.getItem(`profile_role_${user.id}`);
      if (cachedProfileId && cachedRole) {
        setProfileId(cachedProfileId);
        setRole(cachedRole);
        setIsLoading(false);
        return;
      }

      // Fetch from database
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              email: user.email,
              role: 'user'
            })
            .select('id, role')
            .single();

          if (!createError && newProfile) {
            setProfileId(newProfile.id);
            setRole(newProfile.role);
            sessionStorage.setItem(`profile_${user.id}`, newProfile.id);
            sessionStorage.setItem(`profile_role_${user.id}`, newProfile.role);
          }
        }
      } else if (data) {
        setProfileId(data.id);
        setRole(data.role);
        sessionStorage.setItem(`profile_${user.id}`, data.id);
        sessionStorage.setItem(`profile_role_${user.id}`, data.role);
      }
      
      setIsLoading(false);
    }
    
    getProfileId();
  }, [user]);

  const isAdmin = role === 'admin';

  return (
    <ProfileContext.Provider value={{ profileId, role, isAdmin, isLoading }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
}