# AgroEye • Smart Precision Farming Platform

An enterprise-grade, high-contrast, precision smart farming web application designed for farmers, field operators, and agronomists to monitor real-time crop telemetry, atmospheric microclimates, live optical camera feeds with Pan-Tilt-Zoom controls, and real-time YOLOv8 AI pest/disease anomaly detections.

---

## 🌟 Key Features

### 1. 🌾 Live Farm Dashboard (`/`)
- **Telemetry State Control:** Live toggle between **Edge Live Sync** (real-time field stream) and **Offline Simulated Buffer Mode** (cached edge buffer #04).
- **Environment Status Strip:** Real-time health indicators (Water Normal, Temp Normal, Air Good).
- **High Priority Weather Alert:** Instant storm/rain advisory and canopy protection alerts.
- **2x2 Telemetry Sensor Matrix:** Live Volumetric Soil Moisture, Canopy Temperature, Relative Humidity with VPD (Vapor Pressure Deficit), and AQI / PM2.5 air quality readouts.
- **Recent AI Anomaly Inspector:** Live card displaying YOLOv8 lesion detections with confidence ratings and instant diagnostic links.
- **Farm Optical Stream Preview:** Embedded wide-angle field camera preview with HUD overlays.

### 2. 📹 Live Tactical Camera Stream (`/live`)
- **WebRTC Live Stream:** High-definition 1080p / 25 FPS stream with latency telemetry and battery indicators.
- **HUD Overlays:** Reticle corners, bounding box detections (`WHEAT CANOPY 98.4% HEALTHY`), exposure and ISO telemetry, real-time timecode clock.
- **Tactical Field Controls:** Play/Pause, Stop, High-res Snapshot capture (with toast feedback), Fullscreen, Reset PTZ, and **IR Night Vision Mode**.
- **Pan-Tilt-Zoom (PTZ) D-Pad:** Interactive step directional controller (Up, Down, Left, Right, Zoom In, Zoom Out, Center Preset).
- **Offline Stream Fallback:** Resilient fallback screen with automated reconnection and hardware diagnostics.

### 3. ⛅ Weather & Microclimate Station (`/weather`)
- **Microclimate Station #04:** Current temperature, conditions, and GPS node telemetry.
- **2x3 Deep Sensor Grid:** Ambient Temperature, Air Humidity, Wind Velocity & Direction, Solar Radiation (W/m²) & UV Index, Atmospheric Barometric Pressure (hPa), and Evapotranspiration loss ($ET_0$).
- **Hourly Microclimate Breakdown:** 24-hour temp, rain probability, and VPD forecast.
- **7-Day Agronomic Forecast & Spray Advisory:** Day-by-day precipitation and smart spray window guidance (*Optimal Window*, *Caution*, *Do Not Spray*).

### 4. 🔬 YOLOv8 AI Detections Feed (`/detections`)
- **Real-Time Inference Feed:** Sub-25ms YOLOv8 edge vision detections.
- **Multi-Category Filtering:** Filter by All, Disease, Pest Infestation, Water Stress, Invasive Weeds, and Nutrient Deficiencies.
- **Search & Plot Filter:** Filter detections across crops, plots, or pathogen keywords.
- **Automatic Ingestion Support:** Automatic image opening and notification alerts for newly detected images hosted on `iilo` or Firebase.

### 5. 🎯 Detection Deep Dive Diagnostics (`/detections/[id]`)
- **High-Res Diagnostic Canvas:** Detailed bounding box reticle with pathogen labels and confidence scores.
- **Telemetry at Detection Timestamp:** Instantaneous snapshot of canopy temp, humidity, leaf wetness hours, and soil moisture when the anomaly was photographed.
- **Agronomic Treatment Protocols:** Exact bio-fungicide / pesticide dosages, water volume per acre, application time windows, and quarantine rules.
- **Direct Actions:** Mark as Treated, Schedule Autonomous Spray Drone, Export PDF Report.

### 6. 👤 Farm Profile & Hardware Gateway Hub (`/profile`)
- **Farmer Profile:** Operator central dashboard (Sardar Baldev Singh, Udaipur, Rajasthan).
- **Plot Management:** Monitored plot acreage, sowing dates, soil classifications, and health scores.
- **IoT Hardware Manager:** Status, signal strength, and battery health of connected Raspberry Pi cameras, weather stations, and soil probe hubs.
- **Firebase Connection Config:** Interactive settings to configure and test Realtime Database (`readings`, `latest_image_url`) and Firestore collections.
- **Multilingual Support:** English, Hindi (हिन्दी), and Rajasthani (Mewari).

---

## 🚀 Deployment to Vercel

1. Push this repository to GitHub or GitLab.
2. Go to [Vercel Dashboard](https://vercel.com) and click **"Add New Project"**.
3. Import this repository. Next.js is automatically detected.
4. Add any environment variables from `.env.example` in the Vercel project settings:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
5. Click **Deploy**. Vercel will build and launch the application on a global edge CDN.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```
Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.
