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
        
        // Fetch user's IP-based location with failover backup providers
        let ipLocation = null;
        try {
          const userIpRes = await fetch('http://ip-api.com/json');
          if (userIpRes.ok) {
            const userIpData = await userIpRes.json();
            if (userIpData && userIpData.status === 'success') {
              ipLocation = {
                lat: userIpData.lat,
                lon: userIpData.lon,
                city: userIpData.city || SILIGURI_COORDS.city,
                country: userIpData.country || SILIGURI_COORDS.country
              };
            }
          }
        } catch (e) {
          console.warn("Primary IP lookup (ip-api.com) failed, trying backup:", e);
        }

        if (!ipLocation) {
          try {
            // Backup provider: freeipapi.com (HTTPS supported, no keys required)
            const backupRes = await fetch('https://freeipapi.com/api/json');
            if (backupRes.ok) {
              const backupData = await backupRes.json();
              if (backupData) {
                ipLocation = {
                  lat: backupData.latitude,
                  lon: backupData.longitude,
                  city: backupData.cityName || SILIGURI_COORDS.city,
                  country: backupData.countryName || SILIGURI_COORDS.country
                };
              }
            }
          } catch (backupErr) {
            console.warn("Backup IP lookup (freeipapi.com) failed:", backupErr);
          }
        }

        if (ipLocation) {
          userLocation = ipLocation;
        }

        // Try refining user location using GPS Geolocation (blocking with 3s timeout)
        if (settings.useGps !== false && navigator.geolocation) {
          try {
            const gpsCoords = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                (pos) => resolve(pos.coords),
                (err) => reject(err),
                { timeout: 3000, enableHighAccuracy: true }
              );
            });
            if (gpsCoords) {
              userLocation.lat = gpsCoords.latitude;
              userLocation.lon = gpsCoords.longitude;
              
              // Reverse-geocode coordinates to get the user's actual city and country
              try {
                const geoRes = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${gpsCoords.latitude}&lon=${gpsCoords.longitude}`,
                  { headers: { 'Accept-Language': 'en' } }
                );
                if (geoRes.ok) {
                  const geoData = await geoRes.json();
                  if (geoData && geoData.address) {
                    const city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.suburb || geoData.address.state_district || SILIGURI_COORDS.city;
                    const country = geoData.address.country || SILIGURI_COORDS.country;
                    userLocation.city = city;
                    userLocation.country = country;
                  }
                }
              } catch (geoErr) {
                console.warn("Reverse geocoding failed, keeping IP-based location names:", geoErr);
              }
            }
          } catch (gpsErr) {
            console.log("GPS Geolocation failed or timed out, using IP/default location:", gpsErr);
          }
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
        const mocks = generateMockData(domain, serverData.city, serverData.country, latency, userLocation);

        // Override journey nodes with actual coordinates and resolved details
        const enrichedJourney = mocks.journey.map(node => {
          if (node.type === 'user') {
            return { ...node, location: `${userLocation.city}, ${userLocation.country}` };
          }
          if (node.type === 'isp') {
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

        // Fetch DNS and WHOIS data
        let dnsRecords = [];
        try {
          const dnsRes = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
          if (dnsRes.ok) {
            const dnsData = await dnsRes.json();
            if (dnsData.Answer) {
              dnsRecords = dnsData.Answer.map(a => a.data);
            }
          }
        } catch (e) {
          console.warn("DNS API failed:", e);
        }

        let whois = { registrar: 'Unknown', registered: 'Unknown', expires: 'Unknown' };
        try {
          const whoisRes = await fetch(`https://rdap.org/domain/${domain}`);
          if (whoisRes.ok) {
            const whoisData = await whoisRes.json();
            if (whoisData.events) {
              const regEvent = whoisData.events.find(e => e.eventAction === 'registration');
              const expEvent = whoisData.events.find(e => e.eventAction === 'expiration');
              if (regEvent) whois.registered = new Date(regEvent.eventDate).toISOString().split('T')[0];
              if (expEvent) whois.expires = new Date(expEvent.eventDate).toISOString().split('T')[0];
            }
            if (whoisData.entities && whoisData.entities.length > 0) {
              const registrarEntity = whoisData.entities.find(e => e.roles && e.roles.includes('registrar'));
              if (registrarEntity && registrarEntity.vcardArray) {
                const fnItem = registrarEntity.vcardArray[1].find(item => item[0] === 'fn');
                if (fnItem) whois.registrar = fnItem[3];
              }
            }
          }
        } catch (e) {
          console.warn("RDAP API failed:", e);
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
            cookies: actualCookies,
            dns: dnsRecords,
            whois
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

  const removeCookies = useCallback(async (cookiesToDelete) => {
    if (typeof chrome === 'undefined' || !chrome.cookies) return;
    
    // delete in browser
    for (const cookie of cookiesToDelete) {
      const protocol = cookie.secure ? 'https:' : 'http:';
      // Some domains have leading dot, removing it for url
      const cleanDomain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
      const cookieUrl = `${protocol}//${cleanDomain}${cookie.path}`;
      try {
        await chrome.cookies.remove({ url: cookieUrl, name: cookie.name });
      } catch (e) {
        console.error("Failed to remove cookie", e);
      }
    }
    
    // Update local state
    setData(prev => {
      if (!prev) return prev;
      const namesToDelete = new Set(cookiesToDelete.map(c => c.name));
      const remainingCookies = prev.cookies.filter(c => !namesToDelete.has(c.name));
      return { ...prev, cookies: remainingCookies };
    });
  }, []);

  return { loading, error, data, triggerAnalysis: fetchData, removeCookies };
}
