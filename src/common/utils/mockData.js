/**
 * Generates rich, context-aware mockup metrics and connection pathways
 * @param {string} domain Target website domain
 * @param {string} serverCity Target server city
 * @param {string} serverCountry Target server country
 * @param {number} latency Measured dynamic connection latency in milliseconds
 * @returns {object} Mocked fields matching the UI design requirements
 */
export function generateMockData(domain, serverCity, serverCountry, latency, userLocation) {
  // 1. Hops count between 8 and 16
  const hops = Math.floor(Math.random() * 9) + 8;

  // 2. Data Travel Time (typically slightly lower than full ping latency)
  const travelTimeVal = latency 
    ? (latency * 0.72 + Math.random() * 4).toFixed(2) 
    : (120 + Math.random() * 20).toFixed(2);
  const dataTravelTime = `~${travelTimeVal} ms`;

  // 3. Privacy laws and level checks based on hosting region
  let countryLaw = "Data Privacy Protection Act";
  let privacyLevel = "Strong (7/10)";
  let privacyLevelText = "This country has strong data protection laws (GDPR Equivalent)";
  let privacyLevelVal = 7;
  let riskScore = "2 / 10";
  let riskScoreVal = 2;

  const lowerCountry = (serverCountry || "").toLowerCase();
  
  if (lowerCountry.includes("india")) {
    countryLaw = "IT Act, 2000";
    privacyLevel = "Strong (7/10)";
    privacyLevelText = "This country has strong data protection laws (GDPR Equivalent)";
    privacyLevelVal = 7;
    riskScore = "2 / 10";
    riskScoreVal = 2;
  } else if (
    lowerCountry.includes("germany") ||
    lowerCountry.includes("france") ||
    lowerCountry.includes("netherlands") ||
    lowerCountry.includes("united kingdom") ||
    lowerCountry.includes("ireland") ||
    lowerCountry.includes("europe") ||
    lowerCountry.includes("switzerland")
  ) {
    countryLaw = "GDPR / EU Regulation";
    privacyLevel = "Very Strong (9/10)";
    privacyLevelText = "Excellent data protection laws strictly protecting users";
    privacyLevelVal = 9;
    riskScore = "1 / 10";
    riskScoreVal = 1;
  } else if (
    lowerCountry.includes("united states") || 
    lowerCountry.includes("us") || 
    lowerCountry.includes("usa")
  ) {
    countryLaw = "CCPA / COPPA / HIPAA";
    privacyLevel = "Moderate (6/10)";
    privacyLevelText = "State-level laws offer moderate protection";
    privacyLevelVal = 6;
    riskScore = "3 / 10";
    riskScoreVal = 3;
  }

  // 4. Carbon / Green Sustainability details
  const carbonScore = ["A", "B", "A+", "A"][Math.floor(Math.random() * 4)];

  // 5. Stylized Connection Data Journey cities
  const journey = [
    { name: "You", location: "Siliguri, India", type: "user" },
    { name: "ISP", location: "Siliguri, India", type: "isp" }
  ];

  const city = serverCity || "Mumbai";
  const country = serverCountry || "India";

  // Dynamic regional gateway hub routing based on user's GPS/IP location coordinates
  let networkHub = "Kolkata, India";
  if (userLocation && userLocation.lat && userLocation.lon) {
    const lat = userLocation.lat;
    const lon = userLocation.lon;
    if (userLocation.country && userLocation.country.toLowerCase().includes("india")) {
      // Segment routing path based on geographical sectors of India
      if (lat > 25) {
        if (lon < 80) {
          networkHub = "New Delhi, India";
        } else {
          networkHub = "Kolkata, India";
        }
      } else if (lat <= 20) {
        if (lon < 79) {
          networkHub = "Bangalore, India";
        } else {
          networkHub = "Chennai, India";
        }
      } else {
        networkHub = "Mumbai, India";
      }
    } else {
      networkHub = `State Exchange, ${userLocation.country}`;
    }
  }

  if (lowerCountry.includes("india")) {
    journey.push(
      { name: "Network", location: networkHub, type: "network" },
      { name: "Server", location: `${city}, India`, type: "server" }
    );
  } else {
    journey.push(
      { name: "Network", location: networkHub, type: "network" },
      { name: "Transit", location: "London, United Kingdom", type: "transit" },
      { name: "Server", location: `${city}, ${country}`, type: "server" }
    );
  }

  // 6. Trackers details
  const trackers = [
    { 
      name: "Google Analytics", 
      domain: "analytics.google.com", 
      status: "Blocked", 
      favicon: "https://www.google.com/s2/favicons?domain=analytics.google.com&sz=16" 
    },
    { 
      name: "Facebook Pixel", 
      domain: "connect.facebook.net", 
      status: "Blocked", 
      favicon: "https://www.google.com/s2/favicons?domain=facebook.com&sz=16" 
    },
    { 
      name: "Amazon Ads", 
      domain: "fls-na.amazon.com", 
      status: "Blocked", 
      favicon: "https://www.google.com/s2/favicons?domain=amazon.com&sz=16" 
    }
  ];

  return {
    hops,
    dataTravelTime,
    privacy: {
      countryLaw,
      privacyLevel,
      privacyLevelText,
      privacyLevelVal,
      riskScore,
      riskScoreVal
    },
    sustainability: {
      carbonScore,
      renewableEnergy: "Yes"
    },
    journey,
    trackers
  };
}
