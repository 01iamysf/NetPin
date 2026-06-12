# NetPin

NetPin is an open source Chrome extension that gives you transparent details about the websites you visit. It provides real-time information on server location coordinates, network latency pathways, carbon footprint scores, and localized privacy protection laws.

## Snapshots

#### Extension Popup
![NetPin Extension Popup](assets/screenshots/popup.png)

#### Dashboard Overview
![Dashboard Overview showing server location and carbon metrics](assets/screenshots/overview.png)

#### Connection History
![Connection Domain History showing past scans](assets/screenshots/history.png)

## Installation & Local Setup

To clone this repository and run the extension locally on your own machine, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/developer/netpin.git
   cd netpin
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the extension for production:**
   ```bash
   npm run build
   ```
   *(Alternatively, run `npm run dev` to start a development server with hot-reloading.)*

4. **Load into Chrome:**
   - Open your Chrome browser and navigate to `chrome://extensions/`
   - Enable the **Developer mode** toggle in the top right corner.
   - Click the **Load unpacked** button.
   - Select the `dist` folder that was just generated in your `netpin` directory.

## Contributing

NetPin is an open source project and anyone is welcome to contribute. 

If you find a bug or run into any issues, please raise an issue in the repository. 

If you have a new idea or want to request a feature, feel free to open a discussion or an issue. Pull requests are also appreciated if you want to write the code yourself.

## License

This project is open source and available under the MIT License.
