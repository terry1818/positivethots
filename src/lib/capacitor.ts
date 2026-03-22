import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();

export async function initCapacitor() {
  if (!isNative()) return;

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setBackgroundColor({ color: '#6633CC' });
    await StatusBar.setStyle({ style: Style.Dark });
  } catch (e) {
    console.warn('StatusBar plugin not available:', e);
  }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch (e) {
    console.warn('SplashScreen plugin not available:', e);
  }
}

/**
 * Take a photo using Capacitor Camera on native, or return null on web
 * so the caller can fall back to browser APIs.
 */
export async function takeNativePhoto(): Promise<Blob | null> {
  if (!isNative()) return null;

  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const photo = await Camera.getPhoto({
      quality: 85,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      width: 1024,
      height: 1024,
    });

    if (!photo.base64String) return null;

    const byteString = atob(photo.base64String);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: `image/${photo.format || 'jpeg'}` });
  } catch (e) {
    console.warn('Native camera cancelled or failed:', e);
    return null;
  }
}

/**
 * Pick a photo from gallery using Capacitor Camera on native, or return null on web.
 */
export async function pickNativePhoto(): Promise<Blob | null> {
  if (!isNative()) return null;

  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const photo = await Camera.getPhoto({
      quality: 85,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
      width: 1024,
      height: 1024,
    });

    if (!photo.base64String) return null;

    const byteString = atob(photo.base64String);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: `image/${photo.format || 'jpeg'}` });
  } catch (e) {
    console.warn('Native photo picker cancelled or failed:', e);
    return null;
  }
}

/**
 * Register for push notifications on native platforms.
 */
export async function registerPushNotifications() {
  if (!isNative()) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
      console.warn('Push notification permission not granted');
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration token:', token.value);
      // TODO: send token to backend for storage
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err.error);
    });
  } catch (e) {
    console.warn('PushNotifications plugin not available:', e);
  }
}
