import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

export const isNative = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();

/**
 * Initialize native plugins immediately after app renders.
 * Called once from main.tsx — configures StatusBar, hides splash screen,
 * and sets up keyboard/safe-area behavior.
 */
export async function initCapacitor() {
  if (!isNative()) return;

  // Run StatusBar + SplashScreen in parallel for fastest startup
  await Promise.allSettled([
    configureStatusBar(),
    configureSplashScreen(),
    configureKeyboard(),
  ]);
}

async function configureStatusBar() {
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await Promise.all([
      StatusBar.setBackgroundColor({ color: '#7C3AED' }),
      StatusBar.setStyle({ style: Style.Dark }),
      StatusBar.setOverlaysWebView({ overlay: false }),
    ]);
  } catch {
    // Plugin not available on this platform
  }
}

async function configureSplashScreen() {
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    // Small delay to let the first paint complete, then hide
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch {
    // Plugin not available
  }
}

async function configureKeyboard() {
  try {
    // Keyboard plugin is optional — use dynamic require to avoid TS module resolution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const keyboardModule: any = await (Function('return import("@capacitor/keyboard")')());
    if (keyboardModule?.Keyboard) {
      await keyboardModule.Keyboard.setResizeMode?.({ mode: 'ionic' });
      await keyboardModule.Keyboard.setScroll?.({ isDisabled: false });
    }
  } catch {
    // Keyboard plugin not installed — that's fine
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
      quality: 80,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      width: 1024,
      height: 1024,
      correctOrientation: true,
      allowEditing: false,
    });

    if (!photo.base64String) return null;
    return base64ToBlob(photo.base64String, photo.format || 'jpeg');
  } catch {
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
      quality: 80,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
      width: 1024,
      height: 1024,
      correctOrientation: true,
    });

    if (!photo.base64String) return null;
    return base64ToBlob(photo.base64String, photo.format || 'jpeg');
  } catch {
    return null;
  }
}

/** Shared base64 → Blob conversion */
function base64ToBlob(base64: string, format: string): Blob {
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: `image/${format}` });
}

/**
 * Register for push notifications on native platforms.
 *
 * IMPORTANT: Show the in-app explainer dialog BEFORE calling this function so
 * users understand what notifications they'll receive AND that lock-screen
 * previews are hidden by default for privacy. The OS-level prompt that
 * `requestPermissions()` triggers is yes/no with no room for context.
 *
 * Recommended pre-prompt copy:
 *   Title: "Stay in the loop"
 *   Body:  "Positive Thots can send you notifications for new matches,
 *           messages, and learning reminders. For your privacy, notification
 *           previews are hidden on your lock screen by default. You can
 *           change this in Settings."
 *   Buttons: "Allow Notifications" / "Not Now"
 *
 * Stores the device token in the database for the current user.
 * Returns the device token or null.
 */
export async function registerPushNotifications(): Promise<string | null> {
  if (!isNative()) return null;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') return null;

    return new Promise((resolve) => {
      PushNotifications.addListener('registration', async (token) => {
        // Store token in database
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await supabase.from('device_tokens' as any).upsert({
              user_id: session.user.id,
              token: token.value,
              platform: getPlatform(),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,token' });
          }
        } catch (e) {
          console.error('Failed to store device token:', e);
        }
        resolve(token.value);
      });

      PushNotifications.addListener('registrationError', () => {
        resolve(null);
      });

      PushNotifications.register();
    });
  } catch {
    return null;
  }
}

/**
 * Add safe-area CSS custom properties for native apps.
 * Call once at startup so components can use var(--safe-area-top), etc.
 */
export function applySafeAreaInsets() {
  if (!isNative()) return;
  const style = document.documentElement.style;
  style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
  style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
  style.setProperty('--safe-area-left', 'env(safe-area-inset-left)');
  style.setProperty('--safe-area-right', 'env(safe-area-inset-right)');
}
