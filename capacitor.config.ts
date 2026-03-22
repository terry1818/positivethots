import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e9a42b4b28b1420896a22ed7d317b095',
  appName: 'positivethots',
  webDir: 'dist',
  server: {
    url: 'https://e9a42b4b-28b1-4208-96a2-2ed7d317b095.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
