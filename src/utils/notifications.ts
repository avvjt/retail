// Browser-level web and high-fidelity virtual notifications utility for RetailX

export interface NotificationSettings {
  enabled: boolean;
  minSeverity: 'High' | 'Medium' | 'Low';
  allowedInstruments: string[];
  aiCuratedOnly: boolean;
  playChime: boolean;
}

export interface MarketAlert {
  id?: string | number;
  title?: string;
  text?: string;
  observation?: string;
  severity?: 'High' | 'Medium' | 'Low' | string;
  instrument?: string;
  category?: string;
  type?: string;
  isSimulated?: boolean;
  time?: string;
}

/**
 * Checks if the application is running inside an iframe.
 */
export function isInsideIframe(): boolean {
  if (typeof window === 'undefined') return false;
  return window.self !== window.top;
}

/**
 * Checks if the browser natively supports the Notification API.
 */
export function isNativeNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Returns true if notifications are supported either natively or via the Virtual Device Notification Engine.
 * We return true always on browsers to ensure simulated notifications work flawlessly in sandboxed environments (iframes).
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Gets the current notification permission state (supports native or virtual fallback).
 */
export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined') return 'unsupported';
  
  // If in iframe sandbox, use simulated virtual permission state
  if (isInsideIframe() || !isNativeNotificationSupported()) {
    return (localStorage.getItem('retailx_virtual_permission') as NotificationPermission) || 'default';
  }
  
  try {
    return Notification.permission;
  } catch {
    // Robust fallback to virtual permission if browser restricts permission access
    return (localStorage.getItem('retailx_virtual_permission') as NotificationPermission) || 'default';
  }
}

/**
 * Requests notification permission (supports native or virtual fallback).
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined') return 'unsupported';
  
  if (isInsideIframe() || !isNativeNotificationSupported()) {
    localStorage.setItem('retailx_virtual_permission', 'granted');
    window.dispatchEvent(new Event('retailx_notification_permission_changed'));
    return 'granted';
  }
  
  try {
    const permission = await Notification.requestPermission();
    localStorage.setItem('retailx_virtual_permission', permission);
    window.dispatchEvent(new Event('retailx_notification_permission_changed'));
    return permission;
  } catch {
    console.warn("⚠️ Native permission blocked in sandbox. Activating high-fidelity virtual notification fallback.");
    localStorage.setItem('retailx_virtual_permission', 'granted');
    window.dispatchEvent(new Event('retailx_notification_permission_changed'));
    return 'granted';
  }
}

// Default notification settings
const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  minSeverity: 'High',
  allowedInstruments: ['NIFTY50', 'BANKNIFTY', 'SENSEX', 'USDINR', 'CRUDEOIL'],
  aiCuratedOnly: true,
  playChime: true,
};

/**
 * Retrieves notification settings from localStorage.
 */
export function getNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem('retailx_notification_settings');
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.error("Failed to parse notification settings:", err);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Saves notification settings to localStorage.
 */
export function saveNotificationSettings(settings: Partial<NotificationSettings>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('retailx_notification_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event('retailx_notification_settings_updated'));
  } catch (err) {
    console.error("Failed to save notification settings:", err);
  }
}

/**
 * Play a professional premium double-tone digital chime on-the-fly using the Web Audio API.
 * This runs natively on any smartphone or browser with zero external file requirements.
 */
export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    
    // First high-frequency notification ding (A5 frequency)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1100, now + 0.12);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Second digital confirmation chime (C6 frequency, staggered by 80ms)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(1250, now + 0.22);
    gain2.gain.setValueAtTime(0.0, now);
    gain2.gain.setValueAtTime(0.06, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.5);
  } catch (err) {
    console.warn("Failed to generate digital notification sound:", err);
  }
}

/**
 * Determines whether an alert is "useful" and matches the user's filter criteria.
 */
export function isAlertUseful(alert: MarketAlert | null | undefined): boolean {
  if (!alert) return false;
  
  const settings = getNotificationSettings();
  if (!settings.enabled) {
    return false;
  }

  // 1. Strictly filter out Simulated / Minor Ticks
  const isSimulated = 
    alert.category === 'Simulated Tick' || 
    alert.type === 'Simulated Tick' || 
    alert.isSimulated || 
    alert.title?.includes('Benchmark Tick') ||
    alert.title?.includes('Tick Update') ||
    alert.title?.toLowerCase().includes('simulated') ||
    alert.category?.toLowerCase().includes('tick') ||
    alert.type?.toLowerCase().includes('tick');

  if (isSimulated) {
    return false;
  }

  // 2. Strictly filter by Severity: only allow High-severity/critical alerts
  const alertSeverity = alert.severity || 'Low';
  if (alertSeverity !== 'High') {
    return false;
  }

  // 3. Filter by Instrument
  if (alert.instrument && settings.allowedInstruments && settings.allowedInstruments.length > 0) {
    const isAllowed = settings.allowedInstruments.includes(alert.instrument.toUpperCase());
    if (!isAllowed) {
      return false;
    }
  }

  return true;
}

/**
 * Triggers a real-time web/push notification on the device if permissions are granted and filters match.
 */
export function notifyUserOfAlert(alert: MarketAlert): void {
  if (typeof window === 'undefined') return;
  
  // Verify notification filters
  if (!isAlertUseful(alert)) return;

  const currentPermission = getNotificationPermissionState();
  if (currentPermission !== 'granted') return;

  const title = alert.title || "Market Observation";
  const body = alert.observation || alert.text || "New real-time market update detected.";

  // A. Trigger Custom Simulated Notification & Audio chime (works inside iframe / dev-preview)
  try {
    const settings = getNotificationSettings();
    if (settings.playChime) {
      playNotificationSound();
    }
    
    // Broadcast event for the in-app floating mobile card component
    window.dispatchEvent(new CustomEvent('retailx_simulated_notification', {
      detail: {
        id: alert.id || Date.now(),
        title: title,
        body: body,
        severity: alert.severity || 'High',
        instrument: alert.instrument || 'NIFTY50',
        category: alert.category || 'Technical',
        time: alert.time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST'
      }
    }));
  } catch (err) {
    console.error("Error dispatching simulated notification:", err);
  }

  // B. Trigger Native Device OS level Notification (if supported & approved natively)
  if (isNativeNotificationSupported() && !isInsideIframe()) {
    try {
      const options: any = {
        body: body,
        tag: `retailx-alert-${alert.id || Date.now()}`,
        renotify: true,
        silent: false,
        timestamp: Date.now(),
      };

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, options);
        }).catch((swErr) => {
          console.warn("ServiceWorker showNotification failed, falling back to window.Notification:", swErr);
          const notification = new Notification(title, options);
          notification.onclick = function(event) {
            event.preventDefault();
            window.focus();
            window.dispatchEvent(new CustomEvent('navigate_to_tab', { detail: '/dashboard/alerts' }));
          };
        });
      } else {
        const notification = new Notification(title, options);
        notification.onclick = function(event) {
          event.preventDefault();
          window.focus();
          window.dispatchEvent(new CustomEvent('navigate_to_tab', { detail: '/dashboard/alerts' }));
        };
      }
    } catch (err) {
      console.warn("⚠️ Native Notification construction blocked or limited by browser sandbox.", err);
    }
  }
}
