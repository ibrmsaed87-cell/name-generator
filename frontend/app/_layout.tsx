import { useEffect } from 'react';
import { Stack } from 'expo-router';

export default function RootLayout() {
  useEffect(() => {
    // Initialize AdMob
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        console.log('AdMob initialized:', adapterStatuses);
        
        // Show app open ad after 3 seconds
        setTimeout(() => {
          showAppOpenAd();
        }, 3000);
      })
      .catch(error => {
        console.log('AdMob initialization failed:', error);
      });
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}