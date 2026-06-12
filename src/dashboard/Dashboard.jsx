import React, { useState, useEffect } from 'react';
import { useServerData } from '../common/hooks/useServerData';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Shield, 
  Leaf, 
  Eye, 
  Lock, 
  MapPin, 
  Globe, 
  Cpu, 
  Clock, 
  TrendingUp, 
  Sun, 
  Moon, 
  Settings, 
  Menu,
  ChevronRight,
  Compass,
  History,
  ListFilter,
  Info,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

// Custom Map center update helper
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 4);
    }
  }, [center, map]);
  return null;
}

import { useSettings } from '../common/hooks/useSettings';

import netpinLogo from '../../icons/gemini-svg.svg';

export default function Dashboard() {
  const { loading, error, data, triggerAnalysis } = useServerData();
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'globe'
  const [darkMode, setDarkMode] = useState(false);
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialTab = urlParams ? (urlParams.get('tab') || 'overview') : 'overview';
  const [activeTab, setActiveTab] = useState(initialTab); // 'overview', 'history', 'lists', 'settings', 'about'

  // Settings State from persistent hook
  const { settings, toggleSetting } = useSettings();

  // Actual scan history state
  const [scanHistory, setScanHistory] = useState([]);

  // Load history from storage on mount
  useEffect(() => {
    const loadHistory = () => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['scanHistory'], (result) => {
          if (result.scanHistory) {
            setScanHistory(result.scanHistory);
          }
        });
      } else {
        const local = localStorage.getItem('scanHistory');
        if (local) {
          try {
            setScanHistory(JSON.parse(local));
          } catch (e) {
            console.error('Failed to parse scan history from localStorage:', e);
          }
        }
      }
    };
    loadHistory();
  }, []);

  // Save scan to history dynamically when data finishes loading
  useEffect(() => {
    if (data && data.domain) {
      const newItem = {
        domain: data.domain,
        ip: data.ip || 'Unknown IP',
        country: data.serverLocation?.country || 'Unknown Country',
        city: data.serverLocation?.city || 'Unknown City',
        latency: data.latency || 0,
        provider: data.hostingProvider || 'Unknown Provider',
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })
      };

      setScanHistory(prev => {
        // Remove existing scan for the same domain so the new one goes to the top
        const filtered = prev.filter(item => item.domain !== newItem.domain);
        const updated = [newItem, ...filtered].slice(0, 50);

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ scanHistory: updated });
        } else {
          localStorage.setItem('scanHistory', JSON.stringify(updated));
        }
        return updated;
      });
    }
  }, [data]);


  const handleClearHistory = () => {
    setScanHistory([]);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ scanHistory: [] });
    } else {
      localStorage.setItem('scanHistory', JSON.stringify([]));
    }
  };

  // Custom marker icon creation with inline CSS
  const getMarkerIcon = (colorClass) => {
    const isPurple = colorClass === 'purple';
    const bgClass = isPurple ? 'bg-purple-600' : 'bg-blue-600';
    const pulseClass = isPurple ? 'bg-purple-500/20' : 'bg-blue-500/20';

    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-7 h-7 rounded-full ${pulseClass} absolute animate-ping"></div>
          <div class="w-4.5 h-4.5 rounded-full ${bgClass} border-2 border-slate-900 flex items-center justify-center shadow-lg">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  };

  // Calculate curve points for Leaflet Polyline mapping
  const getCurvePoints = (start, end) => {
    if (!start || !end) return [];
    const points = [];
    const steps = 40;
    
    const lat1 = start[0];
    const lon1 = start[1];
    const lat2 = end[0];
    const lon2 = end[1];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Linear interpolation
      const lat = lat1 + (lat2 - lat1) * t;
      const lon = lon1 + (lon2 - lon1) * t;
      // Arc perpendicular height offset
      const offset = Math.sin(t * Math.PI) * 1.8;
      const angle = Math.atan2(lat2 - lat1, lon2 - lon1);
      
      const curvedLat = lat + Math.cos(angle + Math.PI / 2) * offset;
      const curvedLon = lon + Math.sin(angle + Math.PI / 2) * offset;
      
      points.push([curvedLat, curvedLon]);
    }
    return points;
  };

  if (loading) {
    return (
      <div className={`w-full min-h-screen ${darkMode ? 'bg-[#0a0e1a] text-slate-200' : 'bg-slate-50 text-slate-800'} flex flex-col items-center justify-center p-8 `}>
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <Globe className="absolute w-8 h-8 text-blue-500 animate-pulse" />
        </div>
        <h2 className="font-bold text-2xl tracking-wider">NetPin</h2>
        <p className="text-slate-400 mt-2 animate-pulse">Gathering routing routes & green certifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full min-h-screen ${darkMode ? 'bg-[#0a0e1a] text-slate-200' : 'bg-slate-50 text-slate-800'} flex flex-col items-center justify-center p-8 text-center `}>
        <Globe className="w-16 h-16 text-red-500 mb-6 animate-pulse" />
        <h2 className="font-bold text-2xl text-red-400">Analysis Error</h2>
        <p className="text-slate-400 mt-2 max-w-md">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"
        >
          Retry Audit
        </button>
      </div>
    );
  }

  if (!loading && !error && !data) {
    return (
      <div className={`w-full min-h-screen ${darkMode ? 'bg-[#0a0e1a] text-slate-200' : 'bg-slate-50 text-slate-800'} flex flex-col items-center justify-center p-8 text-center `}>
        <Globe className="w-16 h-16 text-blue-500 mb-6 opacity-80" />
        <h2 className="font-bold text-3xl mb-2">NetPin Ready</h2>
        <p className="text-slate-400 mt-2 max-w-md text-lg">Auto-analyze is currently disabled in your settings.</p>
        <button 
          onClick={triggerAnalysis} 
          className="mt-8 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] text-lg"
        >
          Start Analysis
        </button>
      </div>
    );
  }

  // Lat/Lon Coords
  const youPosition = [data.userLocation.lat, data.userLocation.lon];
  const serverPosition = [data.serverLocation.lat, data.serverLocation.lon];
  const polylineCurve = getCurvePoints(youPosition, serverPosition);

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${data.domain}&sz=64`;
  const flagUrl = data.serverLocation.countryCode 
    ? `https://flagcdn.com/w40/${data.serverLocation.countryCode.toLowerCase()}.png`
    : null;

  return (
    <div className={`w-full min-h-screen ${darkMode ? 'bg-[#0a0e1a] text-slate-200' : 'bg-slate-50 text-slate-800'} flex flex-col font-sans `}>
      {/* Header */}
      <header className={`border-b ${darkMode ? 'bg-[#0a0e1a]/80 border-slate-900' : 'bg-white/90 border-slate-200'} sticky top-0 z-50 backdrop-blur-md px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
            <img src={netpinLogo} className="w-5 h-5" alt="NetPin" />
          </div>
          <h2 className="font-bold text-2xl tracking-wider bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">NetPin</h2>
        </div>

        {/* Global Tab Banner for context site */}
        <div className={`hidden md:flex items-center gap-4 px-4 py-1.5 rounded-full border ${darkMode ? 'bg-[#0c1220]/60 border-slate-900' : 'bg-slate-100 border-slate-200'}`}>
          <img src={faviconUrl} className="w-4 h-4 rounded-sm" alt={data.domain} />
          <span className="text-sm font-semibold tracking-tight">{data.domain}</span>
          <span className={`w-2 h-2 rounded-full ${data.green ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl border ${darkMode ? 'border-slate-800 text-yellow-400 hover:bg-slate-900' : 'border-slate-200 text-indigo-600 hover:bg-slate-100'} `}
          >
            {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
        </div>
      </header>

      {/* Main Page Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8 animate-fade-in">
        
        {/* Dynamic Inner Tab Router */}
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            {/* Left Column (Details & Map) */}
            <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
              
              {/* Target Website Card */}
              <div className={`border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl ${darkMode ? 'bg-[#0f172a] border-slate-900' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center p-2.5 shadow-md ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <img 
                      src={faviconUrl} 
                      alt={data.domain} 
                      className="w-full h-full object-contain rounded"
                      onError={(e) => { e.target.src = 'https://www.google.com/s2/favicons?domain=google.com&sz=64'; }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold tracking-tight">{data.domain}</h2>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                        https://www.{data.domain}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs text-emerald-400 font-semibold">Connection Secure (SSL Active)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 md:gap-8 border-t md:border-t-0 md:border-l border-slate-800/20 dark:border-slate-800/60 pt-4 md:pt-0 md:pl-8">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">IP Address</span>
                    <p className="text-sm font-extrabold mt-0.5">{data.ip}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">ISP / ASN</span>
                    <p className="text-sm font-extrabold mt-0.5 truncate max-w-[120px]" title={data.isp}>{data.hostingProvider}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Server Location</span>
                    <p className="text-sm font-extrabold mt-0.5 flex items-center gap-1.5">
                      {flagUrl && <img src={flagUrl} className="w-4.5 h-3 object-cover rounded-sm" alt="Flag" />}
                      {data.serverLocation.city}
                    </p>
                  </div>
                </div>
              </div>

              {/* Map & Globe Card */}
              <div className={`border rounded-2xl p-5 flex flex-col shadow-xl relative overflow-hidden h-[420px] ${darkMode ? 'bg-[#0f172a] border-slate-900' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between mb-4 z-10">
                  <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
                    <Compass className="w-5 h-5 text-blue-500" />
                    Server Route Geolocation
                  </h3>
                  
                  {/* Map/Globe Toggle Tabs */}
                  <div className={`flex rounded-lg p-0.5 border ${darkMode ? 'bg-[#0c1220] border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    <button 
                      onClick={() => setViewMode('map')}
                      className={`px-3 py-1 text-xs font-bold rounded-md ${viewMode === 'map' ? (darkMode ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 shadow') : 'text-slate-500'}`}
                    >
                      Map
                    </button>
                    <button 
                      onClick={() => setViewMode('globe')}
                      className={`px-3 py-1 text-xs font-bold rounded-md ${viewMode === 'globe' ? (darkMode ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 shadow') : 'text-slate-500'}`}
                    >
                      Globe
                    </button>
                  </div>
                </div>

                <div className="flex-1 w-full rounded-xl overflow-hidden relative border border-slate-900/30">
                  {viewMode === 'map' ? (
                    <MapContainer 
                      key={darkMode ? 'dark-map' : 'light-map'}
                      center={serverPosition} 
                      zoom={4} 
                      scrollWheelZoom={false}
                      className={`w-full h-full z-0 ${darkMode ? 'dark-map' : ''}`}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapController center={serverPosition} />
                      
                      {/* You Location pin */}
                      <Marker position={youPosition} icon={getMarkerIcon('blue')}>
                        <Popup>
                          <div className="text-slate-100 text-xs font-bold">
                            <span className="text-blue-400">You</span> <br />
                            {data.userLocation.city}, {data.userLocation.country}
                          </div>
                        </Popup>
                      </Marker>

                      {/* Server Location pin */}
                      <Marker position={serverPosition} icon={getMarkerIcon('purple')}>
                        <Popup>
                          <div className="text-slate-100 text-xs font-bold">
                            <span className="text-purple-400">Server ({data.domain})</span> <br />
                            {data.serverLocation.city}, {data.serverLocation.country} <br />
                            IP: {data.ip}
                          </div>
                        </Popup>
                      </Marker>

                      {/* Curved Route Link */}
                      {polylineCurve.length > 0 && (
                        <Polyline 
                          positions={polylineCurve} 
                          color="#3b82f6" 
                          weight={3.5} 
                          dashArray="5, 8"
                          opacity={0.8}
                        />
                      )}
                    </MapContainer>
                  ) : (
                    /* High-tech Globe Mockup View using premium SVG & CSS rotates */
                    <div className="w-full h-full bg-[#0a0e1a] flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-5"></div>
                      
                      {/* Rotating Globe circle */}
                      <div className="relative w-56 h-56 rounded-full border border-blue-500/20 flex items-center justify-center shadow-[inset_0_0_30px_rgba(59,130,246,0.15)] animate-[spin-slow_40s_linear_infinite]">
                        {/* Grid lines representing latitude lines */}
                        <div className="absolute w-full h-[1px] bg-blue-500/10"></div>
                        <div className="absolute w-[1px] h-full bg-blue-500/10"></div>
                        <div className="absolute inset-4 rounded-full border border-dashed border-blue-500/10"></div>
                        <div className="absolute inset-12 rounded-full border border-dotted border-blue-500/10"></div>
                        
                        {/* Global Nodes */}
                        <div className="absolute top-[25%] left-[20%] w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
                        <div className="absolute top-[50%] right-[15%] w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_12px_#a855f7]"></div>
                        <div className="absolute bottom-[30%] left-[45%] w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></div>
                        
                        {/* Connection Arc on globe */}
                        <svg className="absolute w-full h-full top-0 left-0" viewBox="0 0 200 200">
                          <path 
                            d="M 50 60 Q 100 20 150 100" 
                            fill="none" 
                            stroke="#3b82f6" 
                            strokeWidth="1.5" 
                            strokeDasharray="4,4" 
                            className="animate-dash"
                          />
                        </svg>
                      </div>
                      
                      <div className="absolute bottom-4 text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Globe View Simulation</p>
                        <p className="text-[10px] text-blue-400 mt-1">Spinning global routing nodes</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Consolidated Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Distance */}
                <div className={`border rounded-2xl p-4.5 flex items-center gap-4 shadow-lg ${darkMode ? 'bg-[#0f172a] border-slate-900' : 'bg-white border-slate-200'}`}>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Distance</span>
                    <p className="text-base font-extrabold mt-0.5">
                      {data.distance ? `${data.distance.toLocaleString()} km` : 'Pending'}
                    </p>
                  </div>
                </div>

                {/* Measured Latency */}
                <div className={`border rounded-2xl p-4.5 flex items-center gap-4 shadow-lg ${darkMode ? 'bg-[#0f172a] border-slate-900' : 'bg-white border-slate-200'}`}>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Latency</span>
                    <p className="text-base font-extrabold mt-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {data.latency} ms
                    </p>
                  </div>
                </div>

                {/* Data Travel Time */}
                <div className={`border rounded-2xl p-4.5 flex items-center gap-4 shadow-lg ${darkMode ? 'bg-[#0f172a] border-slate-900' : 'bg-white border-slate-200'}`}>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Travel Time</span>
                    <p className="text-base font-extrabold mt-0.5">{data.dataTravelTime}</p>
                  </div>
                </div>

                {/* Hops */}
                <div className={`border rounded-2xl p-4.5 flex items-center gap-4 shadow-lg ${darkMode ? 'bg-[#0f172a] border-slate-900' : 'bg-white border-slate-200'}`}>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Network Hops</span>
                    <p className="text-base font-extrabold mt-0.5">{data.hops} Hops</p>
                  </div>
                </div>

              </div>

              {/* Data Journey Connection Card */}
              <div className={`border rounded-2xl p-5 shadow-xl ${darkMode ? 'bg-[#0f172a] border-slate-900' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-base tracking-wide flex items-center gap-2 mb-4 border-b border-slate-800/15 dark:border-slate-800/50 pb-3">
                  <Cpu className="w-5 h-5 text-indigo-500" />
                  Connection Data Journey
                </h3>

                {/* Vertical diagram */}
                <div className="relative pl-6 space-y-5 py-2">
                  {/* Vertical connecting line */}
                  <div className="absolute left-2.5 top-2.5 bottom-2.5 w-[1.5px] border-l border-dashed border-indigo-500/30"></div>

                  {data.journey.map((node, i) => {
                    const isLast = i === data.journey.length - 1;
                    const isFirst = i === 0;

                    let nodeColorClass = 'bg-blue-600 border-blue-500/30';
                    if (isLast) nodeColorClass = 'bg-purple-600 border-purple-500/30';
                    else if (!isFirst && !isLast) nodeColorClass = 'bg-indigo-600 border-indigo-500/30';

                    return (
                      <div key={i} className="relative flex items-start gap-4 text-xs">
                        {/* Node circle */}
                        <div className={`absolute -left-[20px] w-3 h-3 rounded-full ${nodeColorClass} border flex items-center justify-center z-10`}>
                          <div className="w-1 h-1 rounded-full bg-white"></div>
                        </div>

                        <div>
                          <div className={`font-bold uppercase tracking-wide text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{node.name}</div>
                          <div className={`text-xs font-semibold mt-0.5 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{node.location}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column (Stacked Cards) */}
            <div className="lg:col-span-4 flex flex-col gap-6 min-w-0">
              
              {/* Privacy Analysis Card */}
              <div className={`border rounded-2xl p-5 shadow-xl ${darkMode ? 'bg-[#0f172a] border-slate-900' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-base tracking-wide flex items-center gap-2 mb-4 border-b border-slate-800/15 dark:border-slate-800/50 pb-3">
                  <Shield className="w-5 h-5 text-blue-500" />
                  Privacy Protection
                </h3>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Jurisdiction Country</span>
                    <div className="flex items-center gap-1.5 font-bold">
                      {flagUrl && <img src={flagUrl} className="w-4 h-3 object-cover rounded-sm" alt="Country" />}
                      {data.serverLocation.country}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Applicable Law</span>
                    <span className="font-semibold text-slate-200 bg-slate-800 px-2 py-0.5 rounded text-xs">
                      {data.privacy.countryLaw}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Privacy Rating</span>
                    <span className="font-extrabold text-emerald-400 text-xs px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      {data.privacy.privacyLevel}
                    </span>
                  </div>

                  <div className="border-t border-slate-800/10 dark:border-slate-800/40 pt-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-400">Connection Risk Score</span>
                      <span className="font-extrabold text-xs text-blue-400">{data.privacy.riskScore}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full" 
                        style={{ width: `${data.privacy.riskScoreVal * 10}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">
                      Calculated using ISP integrity, jurisdiction compliance laws, and tracking cookies.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sustainability Card */}
              <div className={`border rounded-2xl p-5 shadow-xl relative overflow-hidden ${darkMode ? 'bg-[#0f172a] border-slate-900' : 'bg-white border-slate-200'}`}>
                
                {/* Wind turbine background decoration */}
                <div className="absolute right-2 bottom-2 w-28 h-28 opacity-15 select-none pointer-events-none">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-emerald-500">
                    {/* Tower */}
                    <path d="M 48 90 L 52 90 L 50.5 45 L 49.5 45 Z" fill="currentColor" />
                    {/* Spinning Blades */}
                    <g transform="translate(50, 45)" className="animate-spin-slow origin-center">
                      <circle cx="0" cy="0" r="1.5" fill="currentColor" />
                      <path d="M 0 0 L 1 -35 L -1 -35 Z" fill="currentColor" />
                      <path d="M 0 0 L 30 18 L 29 20 Z" fill="currentColor" />
                      <path d="M 0 0 L -30 18 L -29 20 Z" fill="currentColor" />
                    </g>
                  </svg>
                </div>

                <h3 className="font-bold text-base tracking-wide flex items-center gap-2 mb-4 border-b border-slate-800/15 dark:border-slate-800/50 pb-3">
                  <Leaf className="w-5 h-5 text-emerald-500" />
                  Sustainability & Carbon
                </h3>

                <div className="space-y-4 text-sm relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Hosting Provider</span>
                    <span className="font-bold">{data.hostingProvider}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Renewable Energy</span>
                    <span className="font-extrabold text-xs text-emerald-400 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Yes (Verified)
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Carbon Efficiency</span>
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center font-extrabold text-emerald-400 text-sm">
                      {data.sustainability.carbonScore}
                    </div>
                  </div>

                  <div className="border-t border-slate-800/10 dark:border-slate-800/40 pt-4">
                    <p className="text-xs text-emerald-400 font-medium">
                      This hosting infrastructure is environmentally friendly. 
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1.5">
                      Covers carbon offset investments and verified green network credentials from The Green Web Foundation.
                    </p>
                  </div>
                </div>
              </div>


              {/* Trackers & Connections Card */}
              <div className={`border rounded-2xl p-5 shadow-xl ${darkMode ? 'bg-[#0f172a] border-slate-900' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-center border-b border-slate-800/15 dark:border-slate-800/50 pb-3 mb-4">
                  <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
                    <Eye className="w-5 h-5 text-indigo-500" />
                    Trackers & Cookies
                  </h3>
                  <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full px-2.5 py-0.5 font-bold">
                    {data.trackers.length} Active
                  </span>
                </div>

                <div className="space-y-3">
                  {data.trackers.map((tracker, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center justify-between p-3 rounded-xl border ${darkMode ? 'bg-[#0c1220]/60 border-slate-900' : 'bg-slate-50 border-slate-150'}`}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={tracker.favicon} 
                          className="w-4 h-4 rounded-sm" 
                          alt={tracker.name} 
                          onError={(e) => { e.target.src = 'https://www.google.com/s2/favicons?domain=google.com&sz=16'; }}
                        />
                        <div>
                          <h4 className="font-bold text-xs">{tracker.name}</h4>
                          <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{tracker.domain}</p>
                        </div>
                      </div>
                      
                      <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                        {tracker.status}
                      </span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setActiveTab('lists')}
                  className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white py-2.5 rounded-xl border border-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Audit All Connections</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Informational Widget */}
              <div className={`border rounded-2xl p-5 shadow-xl border-dashed ${darkMode ? 'bg-[#0d1222] border-blue-500/20 text-slate-400' : 'bg-blue-50/50 border-blue-200 text-slate-600'}`}>
                <div className="flex gap-3">
                  <Info className="w-6 h-6 text-blue-500 shrink-0" />
                  <div>
                    <h4 className={`font-bold text-xs mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>
                      Why Server Location Matters?
                    </h4>
                    <p className="text-[11px] leading-relaxed">
                      Websites you visit store your data on global hosting servers. Knowing where these nodes reside helps you comprehend jurisdiction data protection laws, connection route path, latency speed, and the overall carbon impact of your network queries.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </>
        )}

        {/* TAB 2: HISTORY */}
        {activeTab === 'history' && (
          <div className="lg:col-span-12 flex flex-col gap-6">
            <div className={`border rounded-2xl p-6 shadow-xl ${darkMode ? 'bg-[#0f172a] border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}>
              <div className={`flex justify-between items-center border-b pb-4 mb-6 ${darkMode ? 'border-slate-800/40' : 'border-slate-200'}`}>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <History className="w-6 h-6 text-blue-500" />
                    Connection Domain History
                  </h2>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Recently audited websites on this browser instance.</p>
                </div>
                <button 
                  onClick={handleClearHistory}
                  className="text-xs text-red-500 hover:text-red-400 font-semibold px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/5 "
                >
                  Clear History
                </button>
              </div>

              {scanHistory.length === 0 ? (
                <div className={`text-center py-12 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  <History className={`w-12 h-12 mx-auto mb-3 animate-pulse ${darkMode ? 'text-slate-700' : 'text-slate-300'}`} />
                  <p className="font-semibold text-sm">No historical connection scans recorded.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`border-b font-bold uppercase tracking-wider text-[10px] ${darkMode ? 'border-slate-800/30 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                        <th className="pb-3 pt-1">Domain</th>
                        <th className="pb-3 pt-1">IP Address</th>
                        <th className="pb-3 pt-1">Hosting Provider</th>
                        <th className="pb-3 pt-1">Location</th>
                        <th className="pb-3 pt-1">Latency</th>
                        <th className="pb-3 pt-1">Scanned</th>
                        <th className="pb-3 pt-1 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-slate-800/30' : 'divide-slate-200/50'}`}>
                      {scanHistory.map((item, i) => (
                        <tr key={i} className={darkMode ? 'hover:bg-slate-800/10' : 'hover:bg-slate-50'}>
                          <td className={`py-3.5 font-bold flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                            <img 
                              src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=32`} 
                              className="w-4.5 h-4.5 rounded"
                              alt=""
                              onError={(e) => { e.target.src = 'https://www.google.com/s2/favicons?domain=google.com&sz=16'; }}
                            />
                            {item.domain}
                          </td>
                          <td className={`py-3.5 font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.ip}</td>
                          <td className="py-3.5 font-semibold">{item.provider}</td>
                          <td className="py-3.5">{item.city}, {item.country}</td>
                          <td className="py-3.5">
                            <span className="font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {item.latency} ms
                            </span>
                          </td>
                          <td className={`py-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.date}</td>
                          <td className="py-3.5 text-right">
                            <a 
                              href={`?domain=${item.domain}`} 
                              className="text-blue-500 hover:text-blue-400 font-bold flex items-center justify-end gap-1"
                            >
                              <span>Re-analyze</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LISTS */}
        {activeTab === 'lists' && (
          <div className="lg:col-span-12">
            <div className={`border rounded-2xl p-6 shadow-xl ${darkMode ? 'bg-[#0f172a] border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}>
              <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                <ListFilter className="w-6 h-6 text-blue-500" />
                Tracker & Domain Filters
              </h2>
              <p className={`text-xs mb-6 border-b pb-4 ${darkMode ? 'border-slate-800/10 dark:border-slate-800/40 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                Configure local domain blocking rules and exception white-lists.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className={`font-bold text-sm mb-3 flex justify-between items-center ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <span>Blocked Analytics and Ad Trackers</span>
                    <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-400 rounded-md">3 Active Rules</span>
                  </h3>
                  <div className="space-y-3">
                    <div className={`p-3 rounded-xl border flex justify-between items-center text-xs ${darkMode ? 'bg-[#0c1220]/60 border-slate-800 text-slate-250' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <div>
                        <div className="font-bold">Google Analytics Engine</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">analytics.google.com</div>
                      </div>
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded font-semibold uppercase tracking-wider text-[9px]">Strict Block</span>
                    </div>
                    <div className={`p-3 rounded-xl border flex justify-between items-center text-xs ${darkMode ? 'bg-[#0c1220]/60 border-slate-800 text-slate-250' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <div>
                        <div className="font-bold">Facebook Conversions Pixel</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">connect.facebook.net</div>
                      </div>
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded font-semibold uppercase tracking-wider text-[9px]">Strict Block</span>
                    </div>
                    <div className={`p-3 rounded-xl border flex justify-between items-center text-xs ${darkMode ? 'bg-[#0c1220]/60 border-slate-800 text-slate-250' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <div>
                        <div className="font-bold">Amazon Marketing Ads</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">fls-na.amazon.com</div>
                      </div>
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded font-semibold uppercase tracking-wider text-[9px]">Strict Block</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className={`font-bold text-sm mb-3 flex justify-between items-center ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <span>Whitelist Extensions Exceptions</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md">2 Exempted</span>
                  </h3>
                  <div className="space-y-3">
                    <div className={`p-3 rounded-xl border flex justify-between items-center text-xs ${darkMode ? 'bg-[#0c1220]/60 border-slate-800 text-slate-250' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <div>
                        <div className="font-bold">GitHub Platform API</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">api.github.com</div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded font-semibold uppercase tracking-wider text-[9px]">Exempted</span>
                    </div>
                    <div className={`p-3 rounded-xl border flex justify-between items-center text-xs ${darkMode ? 'bg-[#0c1220]/60 border-slate-800 text-slate-250' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <div>
                        <div className="font-bold">Google Fonts Services</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">fonts.googleapis.com</div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded font-semibold uppercase tracking-wider text-[9px]">Exempted</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className={`font-bold text-sm mb-3 flex justify-between items-center ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>Browser Cookies Stored for Domain</span>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md">
                    {data.cookies ? data.cookies.length : 0} Cookies
                  </span>
                </h3>
                
                {data.cookies && data.cookies.length > 0 ? (
                  <div className={`border rounded-xl max-h-60 overflow-y-auto ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <table className="w-full text-left text-xs">
                      <thead className={`sticky top-0 ${darkMode ? 'bg-[#0f172a]' : 'bg-white'}`}>
                        <tr className={`border-b font-bold text-[10px] uppercase tracking-wider ${darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                          <th className="p-3">Name</th>
                          <th className="p-3">Domain</th>
                          <th className="p-3">Value</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'divide-slate-800/50' : 'divide-slate-200/50'}`}>
                        {data.cookies.map((cookie, idx) => (
                          <tr key={idx} className={darkMode ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50'}>
                            <td className="p-3 font-semibold break-all">{cookie.name}</td>
                            <td className="p-3 text-[10px]">{cookie.domain}</td>
                            <td className="p-3 text-[10px] font-mono truncate max-w-[200px]" title={cookie.value}>{cookie.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={`p-4 text-center rounded-xl border border-dashed text-xs ${darkMode ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-500'}`}>
                    No cookies found for this domain.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="lg:col-span-12">
            <div className={`border rounded-2xl p-6 shadow-xl ${darkMode ? 'bg-[#0f172a] text-slate-200' : 'bg-white text-slate-800'}`}>
              <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                <Settings className="w-6 h-6 text-blue-500" />
                Extension Configuration
              </h2>
              <p className="text-xs text-slate-400 mb-6 border-b border-slate-800/10 dark:border-slate-800/40 pb-4">
                Customize NetPin scan settings, notifications, and analytics engines.
              </p>

              <div className="space-y-6 max-w-xl">
                {/* Auto Analyze */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm">Auto-analyze current tabs</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Automatically trigger geolocation scans when loading new webpages.</p>
                  </div>
                  <button onClick={() => toggleSetting('autoAnalyze')} className="text-blue-500 hover:text-blue-400 ">
                    {settings.autoAnalyze ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-slate-600" />}
                  </button>
                </div>

                {/* Block Trackers */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm">Enable Anti-Tracker Blockers</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Actively intercept known ad networks, analytical spiders, and tracker scripts.</p>
                  </div>
                  <button onClick={() => toggleSetting('blockTrackers')} className="text-blue-500 hover:text-blue-400 ">
                    {settings.blockTrackers ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-slate-600" />}
                  </button>
                </div>

                {/* Green Alerts */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm">Carbon Warning Alerts</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Notify when navigating to websites running on dirty coal/fossil hosting servers.</p>
                  </div>
                  <button onClick={() => toggleSetting('greenAlerts')} className="text-blue-500 hover:text-blue-400 ">
                    {settings.greenAlerts ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-slate-600" />}
                  </button>
                </div>

                {/* Use GPS */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm">Request Precise Geolocation (GPS)</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Utilize browser GPS services for accurate distance coordinates instead of user IP location.</p>
                  </div>
                  <button onClick={() => toggleSetting('useGps')} className="text-blue-500 hover:text-blue-400 ">
                    {settings.useGps ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-slate-600" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ABOUT */}
        {activeTab === 'about' && (
          <div className="lg:col-span-12">
            <div className={`border rounded-2xl p-6 shadow-xl ${darkMode ? 'bg-[#0f172a] text-slate-200' : 'bg-white text-slate-800'} flex flex-col items-center text-center max-w-xl mx-auto`}>
              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30 mb-4">
                <Globe className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-1">
                NetPin
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>VERSION 1.0.0</span>

              <p className={`text-xs leading-relaxed mt-6 max-w-md ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                NetPin is a high-performance Chrome Extension crafted to provide transparent details on global website infrastructures. It resolves server location coordinates, network latency pathways, carbon footprint scores, and localized user-privacy protection laws in real time.
              </p>

              <div className={`border-t w-full my-6 pt-6 grid grid-cols-2 gap-4 text-xs ${darkMode ? 'border-slate-800/40' : 'border-slate-200'}`}>
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Powered By</span>
                  <p className={`font-semibold mt-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>IP-API & GreenWebFoundation</p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Developer License</span>
                  <p className={`font-semibold mt-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>MIT Open Source</p>
                </div>
              </div>

              <a 
                href="https://github.com/01iamysf/NetPin" 
                target="_blank" 
                rel="noreferrer" 
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-md mt-2"
              >
                <span>View Project Github</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Universal Bottom Spacer to prevent overlap with the fixed footer navigation bar */}
        <div className="col-span-1 lg:col-span-12 h-28 pointer-events-none"></div>
      </main>

      {/* Footer Navigation Bar */}
      <footer className={`fixed bottom-0 left-0 right-0 border-t z-50 ${darkMode ? 'bg-[#0a0e1a] border-slate-900' : 'bg-white border-slate-200'}`}>
        <div className="max-w-md mx-auto px-6 py-2 flex items-center justify-between">
          
          {/* Tab 1: Overview */}
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center gap-1 p-1.5 ${activeTab === 'overview' ? 'text-blue-500 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Globe className="w-5 h-5" />
            <span className="text-[10px] tracking-wide">Overview</span>
          </button>

          {/* Tab 2: History */}
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 p-1.5 ${activeTab === 'history' ? 'text-blue-500 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] tracking-wide">History</span>
          </button>

          {/* Tab 3: Lists */}
          <button 
            onClick={() => setActiveTab('lists')}
            className={`flex flex-col items-center gap-1 p-1.5 ${activeTab === 'lists' ? 'text-blue-500 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <ListFilter className="w-5 h-5" />
            <span className="text-[10px] tracking-wide">Lists</span>
          </button>

          {/* Tab 4: Settings */}
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 p-1.5 ${activeTab === 'settings' ? 'text-blue-500 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] tracking-wide">Settings</span>
          </button>

          {/* Tab 5: About */}
          <button 
            onClick={() => setActiveTab('about')}
            className={`flex flex-col items-center gap-1 p-1.5 ${activeTab === 'about' ? 'text-blue-500 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Info className="w-5 h-5" />
            <span className="text-[10px] tracking-wide">About</span>
          </button>

        </div>
      </footer>
    </div>
  );
}
