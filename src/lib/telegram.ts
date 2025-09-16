// Telegram WebApp utilities and helpers

import { TelegramWebApp } from '@/types';

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export class TelegramWebAppService {
  private webApp: TelegramWebApp | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.webApp = window.Telegram.WebApp;
      this.init();
    }
  }

  private init() {
    if (!this.webApp) return;

    // Expand the app to full height
    this.webApp.expand();
    
    // Signal that the app is ready
    this.webApp.ready();

    // Set up theme
    this.setupTheme();
  }

  private setupTheme() {
    if (!this.webApp) return;

    const { themeParams } = this.webApp;
    
    // Apply Telegram theme colors to CSS variables
    if (themeParams.bg_color) {
      document.documentElement.style.setProperty('--tg-bg-color', themeParams.bg_color);
    }
    if (themeParams.text_color) {
      document.documentElement.style.setProperty('--tg-text-color', themeParams.text_color);
    }
    if (themeParams.button_color) {
      document.documentElement.style.setProperty('--tg-button-color', themeParams.button_color);
    }
    if (themeParams.button_text_color) {
      document.documentElement.style.setProperty('--tg-button-text-color', themeParams.button_text_color);
    }
  }

  // Get user data from Telegram
  getUserData() {
    if (!this.webApp?.initDataUnsafe?.user) {
      return null;
    }

    const user = this.webApp.initDataUnsafe.user;
    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      languageCode: user.language_code,
    };
  }

  // Get init data for backend validation
  getInitData() {
    return this.webApp?.initData || '';
  }

  // Show/hide back button
  showBackButton(callback?: () => void) {
    if (!this.webApp) return;
    
    this.webApp.BackButton.show();
    if (callback) {
      this.webApp.BackButton.onClick(callback);
    }
  }

  hideBackButton() {
    if (!this.webApp) return;
    this.webApp.BackButton.hide();
  }

  // Main button controls
  showMainButton(text: string, callback?: () => void) {
    if (!this.webApp) return;

    this.webApp.MainButton.setText(text);
    this.webApp.MainButton.show();
    this.webApp.MainButton.enable();
    
    if (callback) {
      this.webApp.MainButton.onClick(callback);
    }
  }

  hideMainButton() {
    if (!this.webApp) return;
    this.webApp.MainButton.hide();
  }

  setMainButtonLoading(loading: boolean) {
    if (!this.webApp) return;

    if (loading) {
      this.webApp.MainButton.showProgress();
    } else {
      this.webApp.MainButton.hideProgress();
    }
  }

  // Haptic feedback
  hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' = 'light') {
    if (!this.webApp) return;

    if (type === 'success' || type === 'error' || type === 'warning') {
      this.webApp.HapticFeedback.notificationOccurred(type);
    } else {
      this.webApp.HapticFeedback.impactOccurred(type);
    }
  }

  // Close the app
  close() {
    if (!this.webApp) return;
    this.webApp.close();
  }

  // Check if running in Telegram
  isInTelegram() {
    return !!this.webApp;
  }

  // Get color scheme
  getColorScheme() {
    return this.webApp?.colorScheme || 'light';
  }

  // Get viewport info
  getViewportInfo() {
    if (!this.webApp) return null;

    return {
      height: this.webApp.viewportHeight,
      stableHeight: this.webApp.viewportStableHeight,
      isExpanded: this.webApp.isExpanded,
    };
  }
}

// Validate Telegram WebApp data on the server side
export async function validateTelegramWebAppData(initData: string, botToken: string): Promise<boolean> {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) return false;

    urlParams.delete('hash');
    
    // Sort parameters
    const sortedParams = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create secret key
    const crypto = await import('crypto');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    
    // Calculate hash
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(sortedParams).digest('hex');
    
    return calculatedHash === hash;
  } catch (error) {
    console.error('Error validating Telegram WebApp data:', error);
    return false;
  }
}

// Parse user data from init data
export function parseUserFromInitData(initData: string) {
  try {
    const urlParams = new URLSearchParams(initData);
    const userParam = urlParams.get('user');
    
    if (!userParam) return null;
    
    const user = JSON.parse(decodeURIComponent(userParam));
    return {
      telegramId: user.id.toString(),
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
    };
  } catch (error) {
    console.error('Error parsing user from init data:', error);
    return null;
  }
}

// Singleton instance
export const telegramWebApp = new TelegramWebAppService();
