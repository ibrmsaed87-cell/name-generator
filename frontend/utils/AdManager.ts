import { Platform } from 'react-native';

// AdMob IDs from environment variables
const ADMOB_APP_ID = process.env.EXPO_PUBLIC_ADMOB_APP_ID || '';
const ADMOB_BANNER_ID = process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || '';
const ADMOB_INTERSTITIAL_ID = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || '';
const ADMOB_REWARDED_ID = process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID || '';
const ADMOB_APP_OPEN_ID = process.env.EXPO_PUBLIC_ADMOB_APP_OPEN_ID || '';

// Test IDs for development
const TEST_IDS = {
  BANNER: __DEV__ ? 'ca-app-pub-3940256099942544/6300978111' : ADMOB_BANNER_ID,
  INTERSTITIAL: __DEV__ ? 'ca-app-pub-3940256099942544/1033173712' : ADMOB_INTERSTITIAL_ID,
  REWARDED: __DEV__ ? 'ca-app-pub-3940256099942544/5224354917' : ADMOB_REWARDED_ID,
  APP_OPEN: __DEV__ ? 'ca-app-pub-3940256099942544/3419835294' : ADMOB_APP_OPEN_ID,
};

// Check if running on mobile platform
const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

// Mock components and functions for web platform
const WebMockBannerAd = ({ unitId, size, onAdLoaded, onAdFailedToLoad, ...props }: any) => {
  // Return null for web - no ad component
  return null;
};

// Web-safe AdMob utilities
let InterstitialAd: any = null;
let RewardedAd: any = null;
let BannerAd: any = WebMockBannerAd;
let BannerAdSize: any = { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' };
let AdEventType: any = {};
let RewardedAdEventType: any = {};

// Load actual AdMob components only on mobile
if (isMobile) {
  try {
    const AdMobComponents = require('react-native-google-mobile-ads');
    InterstitialAd = AdMobComponents.InterstitialAd;
    RewardedAd = AdMobComponents.RewardedAd;
    BannerAd = AdMobComponents.BannerAd;
    BannerAdSize = AdMobComponents.BannerAdSize;
    AdEventType = AdMobComponents.AdEventType;
    RewardedAdEventType = AdMobComponents.RewardedAdEventType;
  } catch (error) {
    console.log('AdMob not available on this platform:', error);
  }
}

class AdManager {
  private interstitialAd: any = null;
  private rewardedAd: any = null;
  private isInterstitialLoaded = false;
  private isRewardedLoaded = false;

  constructor() {
    if (isMobile && InterstitialAd && RewardedAd) {
      this.initializeAds();
    }
  }

  private initializeAds() {
    try {
      // Initialize Interstitial Ad
      this.interstitialAd = InterstitialAd.createForAdRequest(TEST_IDS.INTERSTITIAL);
      
      this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        this.isInterstitialLoaded = true;
        console.log('Interstitial ad loaded');
      });

      this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.log('Interstitial ad error:', error);
        this.isInterstitialLoaded = false;
      });

      this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('Interstitial ad closed');
        this.loadInterstitialAd();
      });

      // Initialize Rewarded Ad
      this.rewardedAd = RewardedAd.createForAdRequest(TEST_IDS.REWARDED);
      
      this.rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
        this.isRewardedLoaded = true;
        console.log('Rewarded ad loaded');
      });

      this.rewardedAd.addAdEventListener(RewardedAdEventType.ERROR, (error: any) => {
        console.log('Rewarded ad error:', error);
        this.isRewardedLoaded = false;
      });

      this.rewardedAd.addAdEventListener(RewardedAdEventType.CLOSED, () => {
        console.log('Rewarded ad closed');
        this.loadRewardedAd();
      });

      // Load initial ads
      this.loadInterstitialAd();
      this.loadRewardedAd();
    } catch (error) {
      console.log('Error initializing ads:', error);
    }
  }

  private loadInterstitialAd() {
    if (this.interstitialAd && !this.isInterstitialLoaded) {
      this.interstitialAd.load();
    }
  }

  private loadRewardedAd() {
    if (this.rewardedAd && !this.isRewardedLoaded) {
      this.rewardedAd.load();
    }
  }

  showInterstitialAd(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!isMobile) {
        console.log('Interstitial ad simulated on web');
        resolve(false);
        return;
      }

      if (this.interstitialAd && this.isInterstitialLoaded) {
        this.interstitialAd.show();
        this.isInterstitialLoaded = false;
        resolve(true);
      } else {
        console.log('Interstitial ad not ready');
        resolve(false);
      }
    });
  }

  showRewardedAd(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!isMobile) {
        console.log('Rewarded ad simulated on web');
        resolve(true); // Always grant reward on web for testing
        return;
      }

      if (this.rewardedAd && this.isRewardedLoaded) {
        let rewardGranted = false;
        
        const rewardListener = this.rewardedAd.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          () => {
            rewardGranted = true;
            console.log('User earned reward');
          }
        );

        const closedListener = this.rewardedAd.addAdEventListener(
          RewardedAdEventType.CLOSED,
          () => {
            rewardListener();
            closedListener();
            resolve(rewardGranted);
          }
        );

        this.rewardedAd.show();
        this.isRewardedLoaded = false;
      } else {
        console.log('Rewarded ad not ready');
        resolve(false);
      }
    });
  }
}

// Export the AdManager instance and components
const adManager = new AdManager();

export const AdUnitIds = TEST_IDS;
export { BannerAd, BannerAdSize };
export const showInterstitialAd = () => adManager.showInterstitialAd();
export const showRewardedAd = () => adManager.showRewardedAd();
export default adManager;