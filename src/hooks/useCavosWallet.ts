import { useState, useEffect } from 'react';
import { useCavos } from '@/contexts/CavosContext';
import { useAuth } from '@/contexts/AuthContext';

export function useCavosWallet() {
  const { user: cavosUser, wallet: cavosWallet, login, logout } = useCavos();
  const { user: supabaseUser, updateProfile } = useAuth();
  const [isLinked, setIsLinked] = useState(false);

  useEffect(() => {
    // Link Cavos wallet to Supabase profile when both are available
    if (cavosUser && cavosWallet && supabaseUser && !isLinked) {
      linkWalletToProfile();
    }
  }, [cavosUser, cavosWallet, supabaseUser, isLinked]);

  const linkWalletToProfile = async () => {
    if (!cavosWallet?.address || !updateProfile) return;

    try {
      await updateProfile({
        wallet_address: cavosWallet.address,
        // Store Cavos user info as metadata
        full_name: cavosUser?.name || supabaseUser?.user_metadata?.full_name,
      });
      setIsLinked(true);
    } catch (error) {
      console.error('Failed to link Cavos wallet to profile:', error);
    }
  };

  const connectSocialWallet = async (provider: 'google' | 'twitter' | 'apple') => {
    try {
      await login(provider);
      return true;
    } catch (error) {
      console.error(`Failed to connect ${provider} wallet:`, error);
      return false;
    }
  };

  const disconnectSocialWallet = async () => {
    try {
      await logout();
      setIsLinked(false);
      
      // Clear wallet address from Supabase profile
      if (updateProfile) {
        await updateProfile({ wallet_address: null });
      }
    } catch (error) {
      console.error('Failed to disconnect social wallet:', error);
    }
  };

  return {
    cavosUser,
    cavosWallet,
    isLinked,
    connectSocialWallet,
    disconnectSocialWallet,
    isConnected: !!cavosUser && !!cavosWallet,
  };
}