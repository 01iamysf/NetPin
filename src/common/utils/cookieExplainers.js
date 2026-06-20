export function getCookieInfo(cookieName) {
  const name = cookieName.toLowerCase();

  // Essential / Session
  if (
    name.includes("session") ||
    name.includes("token") ||
    name.includes("sid") ||
    name.includes("auth") ||
    name === "c_user" ||
    name === "xs" ||
    name === "st"
  ) {
    return {
      category: "Essential",
      importance: "High",
      color: "blue",
      description:
        "Keeps you logged in and remembers your secure session. Deleting this will usually log you out of the website.",
    };
  }

  // Consent & Preferences
  if (
    name.includes("consent") ||
    name.includes("opt") ||
    name.includes("policy") ||
    name.startsWith("lc-")
  ) {
    return {
      category: "Preferences",
      importance: "Medium",
      color: "emerald",
      description:
        "Remembers your language choices or if you accepted the cookie banner. Deleting this might bring the banner back.",
    };
  }

  // Analytics
  if (
    name.startsWith("_ga") ||
    name.startsWith("_gid") ||
    name === "csm-hit" ||
    name.includes("analytics") ||
    name === "vuid"
  ) {
    return {
      category: "Analytics",
      importance: "Low",
      color: "indigo",
      description:
        "Used by the site owner to track how many people visit the site and what pages they click on. Safe to delete.",
    };
  }

  // Advertising & Tracking
  if (
    name === "_fbp" ||
    name === "fr" ||
    name === "tr" ||
    name.includes("ads") ||
    name.startsWith("ubid") ||
    name === "rxc" ||
    name === "muc" ||
    name.includes("track")
  ) {
    return {
      category: "Advertising / Tracking",
      importance: "Lowest",
      color: "red",
      description:
        "Tracks your browsing behavior to show you targeted ads across the internet. Safe to delete to protect privacy.",
    };
  }

  // Fallback
  return {
    category: "General / Unknown",
    importance: "Medium",
    color: "slate",
    description:
      "A standard cookie set by the website. It might be used for site functionality, preferences, or general tracking.",
  };
}
