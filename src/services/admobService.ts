import { Platform } from 'react-native';
import MobileAds, {
    RewardedAd,
    RewardedAdEventType,
    AdEventType,
    TestIds,
} from 'react-native-google-mobile-ads';

// Global toggle for ads - Set to false to hide all ads
export const SHOW_ADS = true;

// Ad Unit IDs
const REWARDED_AD_UNIT_ID = __DEV__
    ? TestIds.REWARDED
    : Platform.select({
        ios: 'ca-app-pub-4844847303742824/6504201038',
        android: 'ca-app-pub-3572144641927803/9335457475',
    }) || TestIds.REWARDED;

const BANNER_AD_UNIT_ID = __DEV__
    ? TestIds.BANNER
    : Platform.select({
        ios: 'ca-app-pub-4844847303742824/2456270073', // Replace if you have iOS Banner ID
        android: 'ca-app-pub-3572144641927803/8213947497',
    }) || TestIds.BANNER;

// Fallback to test ID if production ID is still a placeholder or if it's development
export const FINAL_REWARDED_ID = (__DEV__ || REWARDED_AD_UNIT_ID.includes('XXXX'))
    ? TestIds.REWARDED
    : REWARDED_AD_UNIT_ID;

export const FINAL_BANNER_ID = (__DEV__ || BANNER_AD_UNIT_ID.includes('XXXX'))
    ? TestIds.BANNER
    : BANNER_AD_UNIT_ID;

class AdMobService {
    private static instance: AdMobService;
    private rewardedAd: RewardedAd | null = null;
    private isInitialized = false;
    private initializationPromise: Promise<void> | null = null;

    private constructor() { }

    /**
     * Check if the native AdMob module is available
     */
    private isModuleAvailable(): boolean {
        try {
            return !!MobileAds && typeof MobileAds === 'function';
        } catch (e) {
            return false;
        }
    }

    static getInstance(): AdMobService {
        if (!AdMobService.instance) {
            AdMobService.instance = new AdMobService();
        }
        return AdMobService.instance;
    }

    /**
     * Initialize AdMob SDK
     * Should be called once when app starts
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        if (!this.isModuleAvailable()) {
            console.warn('[AdMob] Native module not found. Please rebuild the app.');
            return;
        }

        this.initializationPromise = (async () => {
            try {
                // Configure request configuration for better testing
                await MobileAds().setRequestConfiguration({
                    testDeviceIdentifiers: ['EMULATOR'],
                });

                await MobileAds().initialize();
                this.isInitialized = true;
                console.log('[AdMob] Initialized successfully with test configuration');
            } catch (error) {
                console.warn('[AdMob] Initialization failed:', error);
            } finally {
                this.initializationPromise = null;
            }
        })();

        return this.initializationPromise;
    }

    /**
     * Load a rewarded ad
     * @returns Promise that resolves when ad is loaded
     */
    async loadRewardedAd(): Promise<void> {
        if (!this.isModuleAvailable()) {
            console.warn('[AdMob] Cannot load ad: Native module not found.');
            throw new Error('AdMob native module not found');
        }

        // Wait for initialization if it's in progress
        if (this.initializationPromise) {
            await this.initializationPromise;
        }

        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            // If we already have an ad and it's loaded, don't reload
            if (this.rewardedAd && this.rewardedAd.loaded) {
                return;
            }

            // Create new rewarded ad instance if needed
            if (!this.rewardedAd) {
                this.rewardedAd = RewardedAd.createForAdRequest(FINAL_REWARDED_ID, {
                    requestNonPersonalizedAdsOnly: false,
                });
            }

            // Load the ad
            return new Promise<void>((resolve, reject) => {
                if (!this.rewardedAd) {
                    reject(new Error('Failed to create rewarded ad'));
                    return;
                }

                const unsubscribeLoaded = this.rewardedAd.addAdEventListener(
                    RewardedAdEventType.LOADED,
                    () => {
                        console.log('[AdMob] Rewarded ad loaded');
                        unsubscribeLoaded();
                        unsubscribeError();
                        resolve();
                    }
                );

                const unsubscribeError = this.rewardedAd.addAdEventListener(
                    AdEventType.ERROR,
                    (error) => {
                        console.warn('[AdMob] Failed to load rewarded ad:', error);
                        unsubscribeLoaded();
                        unsubscribeError();
                        reject(error);
                    }
                );

                this.rewardedAd.load();
            });
        } catch (error) {
            console.warn('[AdMob] Error loading rewarded ad:', error);
            this.rewardedAd = null;
            throw error;
        }
    }

    /**
     * Show the loaded rewarded ad
     * @param onRewarded Callback when user earns reward
     * @param onAdClosed Callback when ad is closed
     * @param onError Callback when ad fails to show
     * @returns Promise that resolves when ad is shown
     */
    async showRewardedAd(
        onRewarded: () => void,
        onAdClosed?: () => void,
        onError?: (error: Error) => void
    ): Promise<void> {
        if (!this.rewardedAd || !this.rewardedAd.loaded) {
            const error = new Error('No rewarded ad loaded or ready to show');
            if (onError) onError(error);
            throw error;
        }

        return new Promise<void>((resolve, reject) => {
            const ad = this.rewardedAd!;
            let hasEarnedReward = false;

            const unsubscribeEarned = ad.addAdEventListener(
                RewardedAdEventType.EARNED_REWARD,
                (reward) => {
                    console.log('[AdMob] User earned reward:', reward);
                    hasEarnedReward = true;
                    onRewarded();
                }
            );

            const unsubscribeClosed = ad.addAdEventListener(
                AdEventType.CLOSED,
                () => {
                    console.log('[AdMob] Rewarded ad closed');
                    unsubscribeEarned();
                    unsubscribeClosed();
                    unsubscribeError();

                    if (onAdClosed) {
                        onAdClosed();
                    }

                    // Ad can only be shown once, so clear it
                    this.rewardedAd = null;

                    if (hasEarnedReward) {
                        resolve();
                    } else {
                        reject(new Error('Ad closed without earning reward'));
                    }
                }
            );

            const unsubscribeError = ad.addAdEventListener(
                AdEventType.ERROR,
                (error) => {
                    console.warn('[AdMob] Error showing rewarded ad:', error);
                    unsubscribeEarned();
                    unsubscribeClosed();
                    unsubscribeError();

                    if (onError) {
                        onError(error);
                    }

                    this.rewardedAd = null;
                    reject(error);
                }
            );

            try {
                ad.show();
            } catch (err) {
                unsubscribeEarned();
                unsubscribeClosed();
                unsubscribeError();
                this.rewardedAd = null;
                if (onError) onError(err as Error);
                reject(err);
            }
        });
    }

    /**
     * Check if a rewarded ad is loaded and ready to show
     */
    isRewardedAdLoaded(): boolean {
        return this.rewardedAd !== null && this.rewardedAd.loaded;
    }

    /**
     * Clean up the current rewarded ad
     */
    cleanupRewardedAd(): void {
        this.rewardedAd = null;
    }
}

export default AdMobService.getInstance();
