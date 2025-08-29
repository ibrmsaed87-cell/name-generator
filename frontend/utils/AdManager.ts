import { Platform } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  AppOpenAd,
} from 'react-native-google-mobile-ads';

// Ad Unit IDs from environment variables
const ADMOB_APP_ID = process.env.EXPO_PUBLIC_ADMOB_APP_ID;
const BANNER_AD_ID = process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || TestIds.BANNER;
const INTERSTITIAL_AD_ID = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || TestIds.INTERSTITIAL;
const REWARDED_AD_ID = process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID || TestIds.REWARDED;
const APP_OPEN_AD_ID = process.env.EXPO_PUBLIC_ADMOB_APP_OPEN_ID || TestIds.APP_OPEN;

// Use test ads in development or if no real IDs provided
const isDevelopment = __DEV__ || !ADMOB_APP_ID;

export const AdUnitIds = {
  BANNER: isDevelopment ? TestIds.BANNER : BANNER_AD_ID,
  INTERSTITIAL: isDevelopment ? TestIds.INTERSTITIAL : INTERSTITIAL_AD_ID,
  REWARDED: isDevelopment ? TestIds.REWARDED : REWARDED_AD_ID,
  APP_OPEN: isDevelopment ? TestIds.APP_OPEN : APP_OPEN_AD_ID,
};

// Interstitial Ad Manager
class InterstitialAdManager {
  private ad: InterstitialAd;
  private isLoaded = false;
  private isLoading = false;

  constructor() {
    this.ad = InterstitialAd.createForAdRequest(AdUnitIds.INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: false,
    });
    
    this.setupEventListeners();
    this.loadAd();
  }

  private setupEventListeners() {
    this.ad.addAdEventListener(AdEventType.LOADED, () => {
      console.log('Interstitial ad loaded');
      this.isLoaded = true;
      this.isLoading = false;
    });

    this.ad.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('Interstitial ad error:', error);
      this.isLoaded = false;
      this.isLoading = false;
      // Retry loading after 30 seconds
      setTimeout(() => this.loadAd(), 30000);
    });

    this.ad.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('Interstitial ad closed');
      this.isLoaded = false;
      // Load next ad
      this.loadAd();
    });

    this.ad.addAdEventListener(AdEventType.OPENED, () => {
      console.log('Interstitial ad opened');
    });
  }

  private loadAd() {
    if (!this.isLoading && !this.isLoaded) {
      console.log('Loading interstitial ad...');
      this.isLoading = true;
      this.ad.load();
    }
  }

  public show() {
    if (this.isLoaded) {
      console.log('Showing interstitial ad');
      this.ad.show();
    } else {
      console.log('Interstitial ad not ready, loading...');
      this.loadAd();
    }
  }

  public get ready() {
    return this.isLoaded;
  }
}

// Rewarded Ad Manager
class RewardedAdManager {
  private ad: RewardedAd;
  private isLoaded = false;
  private isLoading = false;

  constructor() {
    this.ad = RewardedAd.createForAdRequest(AdUnitIds.REWARDED, {
      requestNonPersonalizedAdsOnly: false,
    });
    
    this.setupEventListeners();
    this.loadAd();
  }

  private setupEventListeners() {
    this.ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('Rewarded ad loaded');
      this.isLoaded = true;
      this.isLoading = false;
    });

    this.ad.addAdEventListener(RewardedAdEventType.ERROR, (error) => {
      console.log('Rewarded ad error:', error);
      this.isLoaded = false;
      this.isLoading = false;
      // Retry loading after 30 seconds
      setTimeout(() => this.loadAd(), 30000);
    });

    this.ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      console.log('Rewarded ad reward earned:', reward);
    });

    this.ad.addAdEventListener(RewardedAdEventType.CLOSED, () => {
      console.log('Rewarded ad closed');
      this.isLoaded = false;
      // Load next ad
      this.loadAd();
    });

    this.ad.addAdEventListener(RewardedAdEventType.OPENED, () => {
      console.log('Rewarded ad opened');
    });
  }

  private loadAd() {
    if (!this.isLoading && !this.isLoaded) {
      console.log('Loading rewarded ad...');
      this.isLoading = true;
      this.ad.load();
    }
  }

  public show() {
    return new Promise<boolean>((resolve) => {
      if (this.isLoaded) {
        console.log('Showing rewarded ad');
        
        const earnedRewardListener = this.ad.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          () => {
            earnedRewardListener();
            resolve(true);
          }
        );

        const closedListener = this.ad.addAdEventListener(
          RewardedAdEventType.CLOSED,
          () => {
            closedListener();
            if (earnedRewardListener) {
              earnedRewardListener();
              resolve(false);
            }
          }
        );

        this.ad.show();
      } else {
        console.log('Rewarded ad not ready');
        resolve(false);
        this.loadAd();
      }
    });
  }

  public get ready() {
    return this.isLoaded;
  }
}

// App Open Ad Manager
class AppOpenAdManager {
  private ad: AppOpenAd;
  private isLoaded = false;
  private isLoading = false;
  private isShowing = false;

  constructor() {
    this.ad = AppOpenAd.createForAdRequest(AdUnitIds.APP_OPEN, {
      requestNonPersonalizedAdsOnly: false,
    });
    
    this.setupEventListeners();
    this.loadAd();
  }

  private setupEventListeners() {
    this.ad.addAdEventListener(AdEventType.LOADED, () => {
      console.log('App open ad loaded');
      this.isLoaded = true;
      this.isLoading = false;
    });

    this.ad.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('App open ad error:', error);
      this.isLoaded = false;
      this.isLoading = false;
      // Retry loading after 30 seconds
      setTimeout(() => this.loadAd(), 30000);
    });

    this.ad.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('App open ad closed');
      this.isLoaded = false;
      this.isShowing = false;
      // Load next ad
      this.loadAd();
    });

    this.ad.addAdEventListener(AdEventType.OPENED, () => {
      console.log('App open ad opened');
      this.isShowing = true;
    });
  }

  private loadAd() {
    if (!this.isLoading && !this.isLoaded) {
      console.log('Loading app open ad...');
      this.isLoading = true;
      this.ad.load();
    }
  }

  public show() {
    if (this.isLoaded && !this.isShowing) {
      console.log('Showing app open ad');
      this.ad.show();
    } else if (!this.isLoaded) {
      console.log('App open ad not ready, loading...');
      this.loadAd();
    }
  }

  public get ready() {
    return this.isLoaded;
  }
}

// Singleton instances
export const interstitialAdManager = new InterstitialAdManager();
export const rewardedAdManager = new RewardedAdManager();
export const appOpenAdManager = new AppOpenAdManager();

// Ad frequency control
class AdFrequencyManager {
  private lastInterstitialTime = 0;
  private lastRewardedTime = 0;
  private interstitialMinInterval = 60 * 1000; // 1 minute
  private rewardedMinInterval = 30 * 1000; // 30 seconds

  public canShowInterstitial(): boolean {
    const now = Date.now();
    return (now - this.lastInterstitialTime) >= this.interstitialMinInterval;
  }

  public canShowRewarded(): boolean {
    const now = Date.now();
    return (now - this.lastRewardedTime) >= this.rewardedMinInterval;
  }

  public recordInterstitialShow(): void {
    this.lastInterstitialTime = Date.now();
  }

  public recordRewardedShow(): void {
    this.lastRewardedTime = Date.now();
  }
}

export const adFrequencyManager = new AdFrequencyManager();

// Helper functions
export const showInterstitialAd = () => {
  if (adFrequencyManager.canShowInterstitial() && interstitialAdManager.ready) {
    interstitialAdManager.show();
    adFrequencyManager.recordInterstitialShow();
  } else {
    console.log('Interstitial ad not ready or too frequent');
  }
};

export const showRewardedAd = async (): Promise<boolean> => {
  if (adFrequencyManager.canShowRewarded() && rewardedAdManager.ready) {
    adFrequencyManager.recordRewardedShow();
    return await rewardedAdManager.show();
  } else {
    console.log('Rewarded ad not ready or too frequent');
    return false;
  }
};

export const showAppOpenAd = () => {
  appOpenAdManager.show();
};

export { BannerAd, BannerAdSize };