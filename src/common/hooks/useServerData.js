import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettings } from './useSettings';
import { calculateHaversineDistance } from '../utils/haversine';
import { generateMockData } from '../utils/mockData';

// Default user fallback coordinates (Siliguri, India)
const SILIGURI_COORDS = { lat: 26.7271, lon: 88.3953, city: "Siliguri", country: "India" };

export function useServerData() {
  const { settings, loaded: settingsLoaded } = useSettings();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Helper to extract clean domain/hostname
  const getCleanDomain = async () => {
    // 1. Check URL query parameters (important for dashboard tab)
    const urlParams = new URLSearchParams(window.location.search);
    const domainParam = urlParams.get('domain');
    if (domainParam) {
      return domainParam.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    }

    // 2. Query chrome tabs if available
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      try {
        // Query active tab in the current window (primarily for popup)
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && activeTab.url) {
          const url = new URL(activeTab.url);
          if (url.protocol.startsWith('http') && !url.hostname.includes('chrome-extension')) {
            return url.hostname;
          }
        }

        // If in dashboard and current window active tab is the extension itself,
        // search for the active tab in other windows (the website the user came from)
        const tabs = await chrome.tabs.query({ active: true });
        for (const tab of tabs) {
          if (tab.url) {
            const url = new URL(tab.url);
            if (url.protocol.startsWith('http') && !url.hostname.includes('chrome-extension')) {
              return url.hostname;
            }
          }
        }

        // fallback query: any tab that is http/https
        const allTabs = await chrome.tabs.query({});
        const webTab = allTabs.find(t => t.url && t.url.startsWith('http'));
        if (webTab) {
          return new URL(webTab.url).hostname;
        }
      } catch (e) {
        console.error("Error querying active tab: ", e);
      }
    }

    // Default fallback domain
    return 'amazon.in';
  };

  // Helper to format ISP/ASN into a pretty hosting provider name
  const formatHostingProvider = (asString, orgString) => {
    if (!asString && !orgString) return 'Unknown Cloud';
    const raw = `${asString || ''} ${orgString || ''}`.toLowerCase();
    
    if (raw.includes('amazon') || raw.includes('aws')) return 'AWS Cloud';
    if (raw.includes('google')) return 'Google Cloud';
    if (raw.includes('cloudflare')) return 'Cloudflare';
    if (raw.includes('digitalocean')) return 'DigitalOcean';
    if (raw.includes('microsoft') || raw.includes('azure')) return 'Microsoft Azure';
    if (raw.includes('fastly')) return 'Fastly';
    if (raw.includes('linode') || raw.includes('akamai')) return 'Akamai Linode';
    if (raw.includes('hetzner')) return 'Hetzner';
    if (raw.includes('ovh')) return 'OVHcloud';
    
    // Clean up ASN prefix (e.g. "AS16509 Amazon.com, Inc." -> "Amazon.com, Inc.")
    return (asString || orgString).replace(/^AS\d+\s+/, '');
  };

  const isMountedRef = useRef(true);
  useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; }; }, []);

  const fetchData = useCallback(async () => {
    const isMounted = isMountedRef.current;
      try {
        setLoading(true);
        setError(null);

        const domain = await getCleanDomain();
        
        // 1. Get User Position (IP-based lookup + browser Geolocation)
        let userLocation = { ...SILIGURI_COORDS };
        
        try {
          // Fetch user's IP-based location for quick, prompt-less coordinates
          const userIpRes = await fetch('http://ip-api.com/json');
          if (userIpRes.ok) {
            const userIpData = await userIpRes.json();
            if (userIpData && userIpData.status === 'success') {
              userLocation = {
                lat: userIpData.lat,
                lon: userIpData.lon,
                city: userIpData.city || SILIGURI_COORDS.city,
                country: userIpData.country || SILIGURI_COORDS.country
              };
            }
          }
        } catch (e) {
          console.warn("User IP geo-lookup failed, using default Siliguri coords:", e);
        }

        // Try refining user location using GPS Geolocation (non-blocking)
        if (settings.useGps !== false && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (isMounted) {
                userLocation.lat = pos.coords.latitude;
                userLocation.lon = pos.coords.longitude;
                // Keep the city/country from IP geo lookup or defaults
              }
            },
            (err) => console.log("Geolocation permission denied/timed out, using IP/default location.")
          );
        }

        // 2. Fetch Server Geolocation from IP-API & Measure Latency
        const startTime = performance.now();
        const serverRes = await fetch(`http://ip-api.com/json/${domain}`);
        if (!serverRes.ok) {
          throw new Error('Failed to fetch server geolocation data.');
        }
        const serverData = await serverRes.json();
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);

        if (serverData.status !== 'success') {
          throw new Error(serverData.message || 'IP lookup failed for domain.');
        }

        // 3. Fetch Green Check status from Green Web Foundation
        let greenStatus = false;
        try {
          const greenRes = await fetch(`https://greencheck.thegreenwebfoundation.org/api/greencheck/${domain}`);
          if (greenRes.ok) {
            const greenData = await greenRes.json();
            greenStatus = !!greenData.green;
          }
        } catch (e) {
          console.warn("Green check API failed, defaulting:", e);
          // Fallback guess based on domain
          greenStatus = domain.includes('amazon') || domain.includes('google') || domain.includes('github');
        }

        // 4. Calculate Distance
        const distance = calculateHaversineDistance(
          userLocation.lat,
          userLocation.lon,
          serverData.lat,
          serverData.lon
        );

        // 5. Generate and Merge Mock Fields
        const hostingProvider = formatHostingProvider(serverData.as, serverData.org);
        const mocks = generateMockData(domain, serverData.city, serverData.country, latency);

        // Override journey nodes with actual coordinates and resolved details
        const enrichedJourney = mocks.journey.map(node => {
          if (node.type === 'user') {
            return { ...node, location: `${userLocation.city}, ${userLocation.country}` };
          }
          if (node.type === 'server') {
            return { ...node, location: `${serverData.city || 'Server Location'}, ${serverData.country}` };
          }
          return node;
        });

        let actualCookies = [];
        if (typeof chrome !== 'undefined' && chrome.cookies) {
          try {
            const baseDomain = domain.replace(/^(www\.)?/, '');
            actualCookies = await chrome.cookies.getAll({ domain: baseDomain });
          } catch(e) {
            console.error("Could not fetch cookies", e);
          }
        }

        if (!greenStatus && settings.greenAlerts) {
          if (typeof chrome !== "undefined" && chrome.notifications) {
            chrome.notifications.create({
              type: "basic",
              iconUrl: "icons/icon-48.png",
              title: "NetPin Alert",
              message: `${domain} is hosted on a non-renewable energy server.`
            });
          }
        }

        if (isMounted) {
          setData({
            domain,
            ip: serverData.query,
            isp: serverData.isp,
            hostingProvider,
            serverLocation: {
              city: serverData.city,
              country: serverData.country,
              countryCode: serverData.countryCode,
              lat: serverData.lat,
              lon: serverData.lon
            },
            userLocation,
            latency,
            distance,
            green: greenStatus,
            hops: mocks.hops,
            dataTravelTime: mocks.dataTravelTime,
            privacy: mocks.privacy,
            sustainability: {
              ...mocks.sustainability,
              hostingProvider // replace with actual
            },
            journey: enrichedJourney,
            trackers: mocks.trackers,
            cookies: actualCookies
          });
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in useServerData hook:", err);
        if (isMounted) {
          setError(err.message || 'An error occurred while analyzing the server.');
          setLoading(false);
        }
      }
    }, [settings]); // end of useCallback

  useEffect(() => {
    if (settingsLoaded) {
      if (settings.autoAnalyze && !data) {
        fetchData();
      } else if (!settings.autoAnalyze && !data) {
        setLoading(false);
      }
    }
  }, [settingsLoaded, settings.autoAnalyze, fetchData, data]);

  return { loading, error, data, triggerAnalysis: fetchData };
}
