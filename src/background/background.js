const TRACKER_DOMAINS = [
  "google-analytics.com",
  "facebook.net",
  "doubleclick.net",
  "googletagmanager.com",
  "criteo.com",
  "amazon-adsystem.com",
  "quantserve.com",
  "scorecardresearch.com"
];

// Generate DNR rules from tracker domains
const getTrackerRules = () => {
  return TRACKER_DOMAINS.map((domain, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: `||${domain}^`,
      resourceTypes: ["script", "xmlhttprequest", "image", "sub_frame"]
    }
  }));
};

// Enable or disable tracker blocking
const updateTrackerBlocking = async (shouldBlock) => {
  try {
    const rules = getTrackerRules();
    const ruleIds = rules.map(r => r.id);

    if (shouldBlock) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIds, // Remove first to avoid duplicates
        addRules: rules
      });
      console.log("NetPin: Tracker blocking enabled.");
    } else {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIds
      });
      console.log("NetPin: Tracker blocking disabled.");
    }
  } catch (error) {
    console.error("NetPin: Failed to update DNR rules", error);
  }
};

// Listen for storage changes to apply settings dynamically
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.netpin_settings) {
    const newSettings = changes.netpin_settings.newValue || {};
    const oldSettings = changes.netpin_settings.oldValue || {};

    if (newSettings.blockTrackers !== oldSettings.blockTrackers) {
      updateTrackerBlocking(newSettings.blockTrackers);
    }
  }
});

// Initial bootup check
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['netpin_settings'], (result) => {
    const settings = result.netpin_settings || { blockTrackers: true };
    updateTrackerBlocking(settings.blockTrackers);
  });
});
