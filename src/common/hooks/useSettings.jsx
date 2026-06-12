import { useState, useEffect } from 'react';

const DEFAULT_SETTINGS = {
  autoAnalyze: true,
  blockTrackers: true,
  greenAlerts: false,
  useGps: true
};

export function useSettings() {
  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  // Load initial settings
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['netpin_settings'], (result) => {
        if (result.netpin_settings) {
          setSettingsState(result.netpin_settings);
        }
        setLoaded(true);
      });
    } else {
      // Fallback for local development (browser environment without extension context)
      const local = localStorage.getItem('netpin_settings');
      if (local) {
        try {
          setSettingsState(JSON.parse(local));
        } catch (e) {}
      }
      setLoaded(true);
    }
  }, []);

  // Toggle a single setting
  const toggleSetting = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettingsState(newSettings);

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ netpin_settings: newSettings });
    } else {
      localStorage.setItem('netpin_settings', JSON.stringify(newSettings));
    }
  };

  return { settings, toggleSetting, loaded };
}
