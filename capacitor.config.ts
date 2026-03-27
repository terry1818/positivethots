import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.positivethots.main',
  appName: 'Positive Thots',
  webDir: 'dist',
  server: {
    url: 'https://positivethots.app',
    cleartext: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      backgroundColor: '#6633CC',
      style: 'DARK',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#6633CC',
      showSpinner: false,
      launchAutoHide: false,
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Deep linking: handle positivethots.app URLs
    appendUrlPathToIntentFilter: true,
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: false,
  },
};

export default config;
