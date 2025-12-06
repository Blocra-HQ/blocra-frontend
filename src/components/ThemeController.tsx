import { useEffect } from 'react';
import { useChain } from '@/contexts/ChainContext';

// HSL values for chain colors
const CHAIN_THEMES: Record<string, { primary: string; ring: string }> = {
    // Starknet: Slate Blue
    starknet: {
        primary: '222 47% 11%', // Dark Slate
        ring: '221 83% 53%', // Bright Blue
    },
    // Ethereum: Classic Blue/Purple
    ethereum: {
        primary: '226 70% 55%', // Blue
        ring: '226 70% 55%',
    },
    // Solana: Teal/Green
    solana: {
        primary: '155 85% 40%', // Green
        ring: '155 85% 40%',
    },
    // Avalanche: Red
    avalanche: {
        primary: '345 80% 50%', // Red
        ring: '345 80% 50%',
    },
    // Polygon: Purple
    polygon: {
        primary: '265 90% 60%', // Purple
        ring: '265 90% 60%',
    },
    // BNB: Gold/Yellow
    bnb: {
        primary: '45 90% 50%', // Gold
        ring: '45 90% 50%',
    },
    // Arbitrum: Blue
    arbitrum: {
        primary: '200 80% 50%', // Light Blue
        ring: '200 80% 50%',
    },
    // Optimism: Red/Orange
    optimism: {
        primary: '10 80% 50%', // Red-Orange
        ring: '10 80% 50%',
    },
    // Base: Blue
    base: {
        primary: '210 90% 50%', // Base Blue
        ring: '210 90% 50%',
    },
    // Default: Minimal Monochrome (White/Black)
    default: {
        primary: '0 0% 98%', // White
        ring: '240 4.9% 83.9%', // Gray
    },
};

export function ThemeController() {
    const { currentChain } = useChain();

    useEffect(() => {
        const theme = CHAIN_THEMES[currentChain.id] || CHAIN_THEMES.default;
        const root = document.documentElement;

        // Apply theme colors
        // We only override primary and ring to keep it subtle but notable
        // If the chain is NOT one of the colorful ones (or if we want the default to be colorful),
        // we might need to adjust.
        // However, the user asked for "subtle but notable".
        // If we change 'primary', it affects buttons.

        // For the "default" minimal look, primary is white (foreground black).
        // For chains, if we set primary to a color, we must ensure foreground is white.

        if (CHAIN_THEMES[currentChain.id]) {
            root.style.setProperty('--primary', theme.primary);
            root.style.setProperty('--ring', theme.ring);
            // Assuming colored buttons need white text
            root.style.setProperty('--primary-foreground', '0 0% 100%');
        } else {
            // Revert to default minimal
            root.style.removeProperty('--primary');
            root.style.removeProperty('--ring');
            root.style.removeProperty('--primary-foreground');
        }

    }, [currentChain]);

    return null;
}
