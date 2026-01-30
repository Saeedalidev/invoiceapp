import { useState, useEffect, useCallback, useRef } from 'react';
import admobService, { SHOW_ADS } from '../services/admobService';

interface UseRewardedAdOptions {
    onRewarded: () => void;
    onAdClosed?: () => void;
    onError?: (error: Error) => void;
}

export const useRewardedAd = (options: UseRewardedAdOptions) => {
    // const { onRewarded, onAdClosed, onError } = options;

    const [isAdLoaded, setIsAdLoaded] = useState(false);
    const [isAdLoading, setIsAdLoading] = useState(false);
    const [isAdShowing, setIsAdShowing] = useState(false);

    // Use a ref to store the latest options to avoid dependency issues
    const optionsRef = useRef(options);
    optionsRef.current = options;

    /**
     * Load a rewarded ad
     */
    const loadAd = useCallback(async () => {
        if (!SHOW_ADS) return;
        // If already loading or loaded, check if it's still valid
        if (isAdLoading) return;

        if (isAdLoaded && admobService.isRewardedAdLoaded()) {
            return;
        }

        setIsAdLoading(true);
        setIsAdLoaded(false);

        try {
            await admobService.loadRewardedAd();
            setIsAdLoaded(true);
            setIsAdLoading(false);
        } catch (error) {
            console.warn('[useRewardedAd] Failed to load ad:', error);
            setIsAdLoading(false);
            setIsAdLoaded(false);

            if (optionsRef.current.onError) {
                optionsRef.current.onError(error as Error);
            }
        }
    }, [isAdLoading, isAdLoaded]);

    /**
     * Show the loaded rewarded ad
     */
    const showAd = useCallback(async () => {
        if (isAdShowing) return;

        if (!admobService.isRewardedAdLoaded()) {
            console.warn('[useRewardedAd] Cannot show ad - not loaded');
            setIsAdLoaded(false);

            // Try to reload
            loadAd();

            if (optionsRef.current.onError) {
                optionsRef.current.onError(new Error('Ad not loaded. Attempting to reload...'));
            }
            return;
        }

        setIsAdShowing(true);

        try {
            await admobService.showRewardedAd(
                () => {
                    // User earned reward
                    optionsRef.current.onRewarded();
                },
                () => {
                    // Ad closed
                    setIsAdShowing(false);
                    setIsAdLoaded(false);

                    if (optionsRef.current.onAdClosed) {
                        optionsRef.current.onAdClosed();
                    }

                    // Auto-load next ad for future use
                    loadAd();
                },
                (error) => {
                    // Error showing ad
                    setIsAdShowing(false);
                    setIsAdLoaded(false);

                    if (optionsRef.current.onError) {
                        optionsRef.current.onError(error);
                    }

                    // Try to reload
                    loadAd();
                }
            );
        } catch (error) {
            console.warn('[useRewardedAd] Failed to show ad:', error);
            setIsAdShowing(false);
            setIsAdLoaded(false);

            if (optionsRef.current.onError) {
                optionsRef.current.onError(error as Error);
            }

            // Try to reload
            loadAd();
        }
    }, [isAdShowing, loadAd]);

    /**
     * Preload ad when hook mounts
     */
    useEffect(() => {
        loadAd();

        // Cleanup ad on unmount if needed
        return () => {
            // Typically we want to keep the ad loaded in the service for the next screen
            // but if we want to be strict:
            // admobService.cleanupRewardedAd();
        };
    }, []);

    return {
        isAdLoaded,
        isAdLoading,
        isAdShowing,
        loadAd,
        showAd,
    };
};

export default useRewardedAd;
