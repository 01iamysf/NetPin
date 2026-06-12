import React, { useState } from 'react';
import { useServerData } from '../common/hooks/useServerData';
import netpinLogo from '../../icons/gemini-svg.svg';
import { 
  Shield, 
  Leaf, 
  Eye, 
  Lock, 
  MapPin, 
  Globe, 
  Settings, 
  ExternalLink, 
  RefreshCw,
  TrendingUp,
  Cpu,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';

export default function Popup() {
  const { loading, error, data, triggerAnalysis } = useServerData();
  const [darkMode, setDarkMode] = useState(false);

  const handleOpenDashboard = () => {
    const domainArg = data ? `?domain=${data.domain}` : '';
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: `dashboard.html${domainArg}` });
    } else {
      window.open(`dashboard.html${domainArg}`, '_blank');
    }
  };

  const handleOpenSettings = () => {
    const domainArg = data ? `?domain=${data.domain}&tab=settings` : '?tab=settings';
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: `dashboard.html${domainArg}` });
    } else {
      window.open(`dashboard.html${domainArg}`, '_blank');
    }
  };

  if (!loading && !error && !data) {
    return (
      <div className={`w-[380px] h-[550px] ${darkMode ? 'bg-[#0a0e1a] text-slate-200' : 'bg-slate-50 text-slate-800'} flex flex-col items-center justify-center p-6 text-center`}>
        <Globe className="w-16 h-16 text-blue-500 mb-6 opacity-80" />
        <h3 className="font-bold text-xl mb-2">NetPin Ready</h3>
        <p className="text-sm text-slate-400 mb-8 max-w-[240px]">Auto-analyze is off. Click below to analyze the current website connection.</p>
        <button 
          onClick={triggerAnalysis} 
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98]"
        >
          Start Analysis
        </button>
        <button 
          onClick={handleOpenSettings} 
          className={`mt-4 flex items-center gap-2 text-sm font-semibold ${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Settings className="w-4 h-4" /> Open Settings
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`w-[380px] h-[550px] ${darkMode ? 'bg-[#0a0e1a] text-slate-200' : 'bg-slate-50 text-slate-800'} flex flex-col items-center justify-center p-6 select-none`}>
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <Globe className="absolute w-6 h-6 text-blue-500 animate-pulse" />
        </div>
        <h3 className="mt-6 font-semibold text-lg tracking-wider text-blue-400">NetPin</h3>
        <p className="text-sm text-slate-400 mt-2 animate-pulse">Analyzing connection route...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-[380px] h-[550px] ${darkMode ? 'bg-[#0a0e1a] text-slate-200' : 'bg-slate-50 text-slate-800'} flex flex-col items-center justify-center p-6 text-center`}>
        <Globe className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="font-semibold text-lg text-red-400">Analysis Failed</h3>
        <p className="text-sm text-slate-400 mt-2 px-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  // Helper to convert lat/lon to X/Y on our SVG coordinate map (320x160 ViewBox)
  const getSvgCoords = (lat, lon) => {
    // Basic equirectangular mapping (clamped and shifted for aesthetic centering on our SVG map)
    const x = ((Number(lon) + 180) * 320) / 360;
    // Invert Y because SVG coordinates start from top-left (0,0)
    const y = ((90 - Number(lat)) * 160) / 180;
    
    // Fine-tune slightly for visual positioning within margins
    return {
      x: Math.max(15, Math.min(305, x)),
      y: Math.max(15, Math.min(145, y))
    };
  };

  const youCoords = getSvgCoords(data.userLocation.lat, data.userLocation.lon);
  const serverCoords = getSvgCoords(data.serverLocation.lat, data.serverLocation.lon);

  // Generate curved path for bezier line
  const midX = (youCoords.x + serverCoords.x) / 2;
  const midY = Math.min(youCoords.y, serverCoords.y) - 25;
  const pathD = `M ${youCoords.x} ${youCoords.y} Q ${midX} ${midY} ${serverCoords.x} ${serverCoords.y}`;

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${data.domain}&sz=64`;
  const flagUrl = data.serverLocation.countryCode 
    ? `https://flagcdn.com/w40/${data.serverLocation.countryCode.toLowerCase()}.png`
    : null;

  return (
    <div className={`w-[380px] min-h-[580px] ${darkMode ? 'bg-[#0a0e1a] text-slate-200' : 'bg-slate-50 text-slate-800'} flex flex-col p-4 font-sans select-none animate-fade-in`}>
      <div className={`flex items-center justify-between border-b ${darkMode ? 'border-slate-900' : 'border-slate-200'} pb-3 mb-3`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
            <img src={netpinLogo} className="w-4 h-4" alt="NetPin" />
          </div>
          <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            NetPin
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-1.5 rounded-lg ${darkMode ? 'text-yellow-400 hover:bg-slate-900' : 'text-indigo-600 hover:bg-slate-200'}`}
          >
            {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
          <button 
            onClick={handleOpenSettings}
            className={`p-1.5 rounded-lg ${darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'}`}
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Website Card */}
      <div className={`${darkMode ? 'bg-[#0f172a] border-slate-900' : 'bg-white border-slate-200'} border rounded-xl p-3 mb-3 flex items-center justify-between shadow-lg`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-slate-100'} flex items-center justify-center p-1.5 overflow-hidden`}>
            <img 
              src={faviconUrl} 
              alt={data.domain} 
              className="w-full h-full object-contain rounded"
              onError={(e) => { e.target.src = 'https://www.google.com/s2/favicons?domain=google.com&sz=64'; }}
            />
          </div>
          <div>
            <div className={`font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'} text-sm tracking-tight truncate max-w-[180px]`}>
              {data.domain}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Lock className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] text-emerald-400 font-medium">Connection is secure</span>
            </div>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
          Active
        </span>
      </div>

      {/* Location Card */}
      <div className={`${darkMode ? 'bg-[#0f172a] border-slate-900' : 'bg-white border-slate-200'} border rounded-xl p-3.5 mb-3 shadow-lg`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              {flagUrl ? (
                <img src={flagUrl} alt={data.serverLocation.country} className="w-5 h-3.5 rounded object-cover shadow-sm" />
              ) : (
                <span className="text-sm">📍</span>
              )}
              <h4 className={`font-bold text-base ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                {data.serverLocation.city || 'Unknown City'}, {data.serverLocation.country}
              </h4>
            </div>
            
            <div className={`mt-2.5 space-y-1 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>IP: <strong className={`${darkMode ? 'text-slate-300' : 'text-slate-700'} font-medium`}>{data.ip}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <span className="truncate max-w-[200px]">ISP: <strong className={`${darkMode ? 'text-slate-300' : 'text-slate-700'} font-medium`}>{data.isp}</strong></span>
              </div>
            </div>
          </div>

          <div className={`px-2.5 py-1 rounded-lg ${darkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'} border text-xs font-bold text-center`}>
            {data.hostingProvider}
          </div>
        </div>
      </div>

      {/* Stylized SVG Map */}
      <div className={`${darkMode ? 'bg-[#0f172a] border-slate-900' : 'bg-white border-slate-200'} border rounded-xl p-3 mb-3 shadow-lg overflow-hidden relative`}>
        <div className={`text-[10px] uppercase tracking-widest font-semibold mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          Route Map
        </div>
        
        <div className={`relative w-full h-[120px] rounded-lg border flex items-center justify-center ${darkMode ? 'bg-[#0c1220]/60 border-slate-900' : 'bg-slate-50 border-slate-200'}`}>
          {/* Grid Background Overlay */}
          <div className={`absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:16px_16px] ${darkMode ? 'opacity-10' : 'opacity-5'}`}></div>
          
          <svg viewBox="0 0 320 160" className="w-full h-full relative z-10">
            {/* World Land Outline (Stylized Dots Grid or outlines) */}
            {/* Simple decorative path representing abstract continents */}
            <path 
              d="M30,50 Q45,30 65,40 T95,50 T135,40 T165,65 T205,50 T245,60 T290,40 Q310,70 300,100 T270,130 T200,120 T150,110 T100,120 T50,100 Z" 
              fill="none" 
              stroke={darkMode ? "#1e293b" : "#cbd5e1"} 
              strokeWidth="1.5"
              strokeDasharray="2,2" 
              className={darkMode ? "opacity-40" : "opacity-60"}
            />
            
            {/* Connection Dotted Arc */}
            <path 
              d={pathD} 
              fill="none" 
              stroke="#3b82f6" 
              strokeWidth="2" 
              className="animate-dash"
            />

            {/* Glowing User Location Pin */}
            <circle cx={youCoords.x} cy={youCoords.y} r="8" fill="#3b82f6" fillOpacity="0.15" />
            <circle cx={youCoords.x} cy={youCoords.y} r="4" fill="#3b82f6" className="animate-pulse" />
            <circle cx={youCoords.x} cy={youCoords.y} r="1.5" fill="#ffffff" />
            
            {/* Glowing Server Location Pin */}
            <circle cx={serverCoords.x} cy={serverCoords.y} r="8" fill="#a855f7" fillOpacity="0.15" />
            <circle cx={serverCoords.x} cy={serverCoords.y} r="4" fill="#a855f7" className="animate-pulse" />
            <circle cx={serverCoords.x} cy={serverCoords.y} r="1.5" fill="#ffffff" />
          </svg>
        </div>

        {/* Compact Metrics */}
        <div className="flex items-center justify-between mt-3 px-1">
          <div>
            <div className={`text-[10px] uppercase tracking-wider font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Distance</div>
            <div className={`text-lg font-extrabold mt-0.5 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
              {data.distance ? `${data.distance.toLocaleString()} km` : 'Calculating...'}
            </div>
            <div className={`text-[10px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Route travel distance</div>
          </div>
          
          <div className="text-right">
            <div className={`text-[10px] uppercase tracking-wider font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Ping / Latency</div>
            <div className={`text-lg font-extrabold mt-0.5 flex items-center justify-end gap-1 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {data.latency} ms
            </div>
            <div className={`text-[10px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Dynamic query time</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="space-y-2 mb-4">
        {/* Privacy */}
        <div className={`${darkMode ? 'bg-[#0f172a] border-slate-900 hover:border-slate-800' : 'bg-white border-slate-200 hover:border-slate-300'} border rounded-xl p-3 flex items-center justify-between cursor-pointer shadow-lg`} onClick={handleOpenDashboard}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Privacy Protection</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded">
                  Strong
                </span>
              </div>
              <p className={`text-[10px] mt-0.5 truncate max-w-[210px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {data.privacy.countryLaw} protecting your personal data.
              </p>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
        </div>

        {/* Carbon */}
        <div className={`${darkMode ? 'bg-[#0f172a] border-slate-900 hover:border-slate-800' : 'bg-white border-slate-200 hover:border-slate-300'} border rounded-xl p-3 flex items-center justify-between cursor-pointer shadow-lg`} onClick={handleOpenDashboard}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Leaf className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Carbon Impact</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${data.green ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {data.green ? 'Green Hosting' : 'Non-Renewable'}
                </span>
              </div>
              <p className={`text-[10px] mt-0.5 truncate max-w-[210px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {data.green ? 'This host runs on certified green energy sources.' : 'This host does not utilize verified green energy.'}
              </p>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
        </div>

        {/* Trackers */}
        <div className={`${darkMode ? 'bg-[#0f172a] border-slate-900 hover:border-slate-800' : 'bg-white border-slate-200 hover:border-slate-300'} border rounded-xl p-3 flex items-center justify-between cursor-pointer shadow-lg`} onClick={handleOpenDashboard}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Eye className="w-4.5 h-4.5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Trackers Detected</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-indigo-500/20 text-indigo-400 rounded">
                  3 Blocked
                </span>
              </div>
              <p className={`text-[10px] mt-0.5 truncate max-w-[210px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Google Analytics, Facebook Pixel, Amazon Ads.
              </p>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
        </div>
      </div>

      {/* CTA Button */}
      <button 
        onClick={handleOpenDashboard}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-xl font-bold text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:shadow-blue-500/10 active:scale-[0.98] select-none"
      >
        <span>Open Full Dashboard</span>
        <ExternalLink className="w-4 h-4" />
      </button>

      {/* Footer Version Tag */}
      <div className="text-center text-[10px] text-slate-600 mt-3 font-semibold uppercase tracking-wider">
        NetPin v1.0.0
      </div>
    </div>
  );
}
