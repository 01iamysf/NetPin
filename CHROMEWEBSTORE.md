# Chrome Web Store Listing — NetPin

> Last Updated: 2026-06-11

## Store Listing

**Extension Name** [REQUIRED]
NetPin - Geolocation, Latency & Carbon Auditor

**Short Description** [REQUIRED]
Analyze server geolocation, hosting provider, latency routes, green hosting certifications, and privacy laws for any website.

**Detailed Description** [REQUIRED]
NetPin is a developer tools extension that audits and visualizes website hosting infrastructures in real-time.

Understand where your data goes, who hosts it, and how it gets there. With NetPin, you can inspect the physical server location, network latency, and intermediate routing hops, as well as the environmental impact of the site.

Key Features:
- Real-Time Geolocation: Instantly look up the host IP, city, country, and ISP (such as AWS, Google Cloud, or Cloudflare).
- Network Performance Auditor: Measure connection latency (ping speed) and calculate the physical distance from your location using the Haversine formula.
- Dotted Route Visualizer: View connection paths on interactive dark-themed map displays.
- Sustainability Scores: Detect whether the hosting provider uses certified green or renewable energy sources via The Green Web Foundation.
- Legal Privacy Insights: Find out which jurisdiction data protection laws (like GDPR, IT Act 25, or CCPA) govern the server.
- Tracker Audit: Check for active trackers (Google Analytics, Facebook Pixel, etc.) and audit connection security.
- Scan History Logs: Keep track of recently analyzed domains for comparison.

How to Use:
1. Navigate to any website.
2. Click the NetPin icon in the toolbar for a compact, narrow sidebar view.
3. Review the website card, location flag, distance, and quick ratings.
4. Click "Open Full Dashboard" to launch a full-tab dashboard with interactive routing maps, deep-dive cards, lists, and settings.

Privacy & Permissions Disclosure:
NetPin is designed with privacy-first standards. The extension only accesses the URL of your currently active tab when you trigger the scan. No web browsing history is collected, stored, or transmitted off-device.

**Category** [REQUIRED]
Developer Tools

**Single Purpose** [REQUIRED]
Audits server geolocation, network latency, carbon offset green energy status, and privacy laws for active web domains.

**Primary Language** [REQUIRED]
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `icons/icon-128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 2 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 3 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | |

### Screenshot Notes
- Screenshot 1: Show the popup UI overlaid on a popular site like amazon.in, displaying the compact metrics and stylized SVG route map.
- Screenshot 2: Show the full-tab Dashboard UI in dark mode, highlighting the Leaflet interactive map with pins and curved routing paths.
- Screenshot 3: Show the Dashboard UI deep-dive cards (Privacy Analysis, Sustainability turbine animation, and Data Journey tree).

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `tabs` | permissions | Used to query the active tab's URL and title to extract the current hostname/domain name for analysis. |
| `activeTab` | permissions | Grants temporary, secure permission to scan the currently focused web page upon user action. |
| `http://ip-api.com/*` | host_permissions | Allows the extension to fetch server IP coordinates, city, country, and ISP details for the audited website domain. |
| `https://greencheck.thegreenwebfoundation.org/*` | host_permissions | Allows the extension to check green hosting credentials and renewable energy compliance for the audited domain. |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

We do not collect, store, or transmit any user data. Geographic distances are calculated entirely locally on-device.

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL** [RECOMMENDED]
https://github.com/developer/netpin/blob/main/PRIVACY.md

## Distribution

**Visibility**: Public
**Regions**: All regions
**Pricing**: Free

## Developer Info

**Publisher Name** [REQUIRED]
NetPin Labs

**Contact Email** [REQUIRED]
support@netpin.io

**Support URL / Email** [RECOMMENDED]
https://github.com/developer/netpin/issues

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-06-11 | Initial release with full popup and dashboard views. | Draft |

## Review Notes

### Known Issues / Limitations
- Geolocation calculations utilize IP-based coordinate lookups by default. GPS prompts may be blocked in popup contexts due to browser security restrictions, in which case IP approximations are used.
- The free lookup API (IP-API) is limited to 45 requests/minute.
