# NetWatch — Network Monitoring Dashboard

A college Computer Networks project that checks configured hosts, records latency and packet loss, displays live status updates, and creates alerts when a host becomes unreachable or responds slowly.

> **Important:** NetWatch performs real checks from the computer/server where its backend is running. It does not magically see every device on a Wi-Fi network. Private college devices can only be monitored from a machine that can reach them and has permission to do so. ICMP ping may be blocked by some hosts/firewalls.

## Requirements

- Node.js **20.19+ or 22.12+** (LTS recommended)
- npm (installed with Node.js)
- Windows, macOS, or Linux
- Optional: MongoDB for data that persists after restarting the backend. Without MongoDB, the app uses in-memory storage and records are lost when the server stops.

## Run on Windows (simple method)

1. Extract the ZIP file to a normal folder (not inside the ZIP preview).
2. Open that folder in VS Code: **File → Open Folder**.
3. Open **Terminal → New Terminal**.
4. Check Node.js is installed:
   ```bash
   node -v
   npm -v
   ```
5. Install the dependencies (run each command from the project root):
   ```bash
   npm run install:all
   ```
6. Start both the backend and website:
   ```bash
   npm run dev
   ```
7. Open **http://localhost:5173** in your browser. Keep the terminal open.
8. To stop the project, click the terminal and press **Ctrl+C**.

If `npm run install:all` fails, try the installs separately:
```bash
npm --prefix server install
npm --prefix client install
```

## Run each part separately (troubleshooting)

Open two terminals in VS Code.

**Terminal 1 — backend:**
```bash
npm --prefix server run dev
```
Backend health check: http://localhost:5000/api/health

**Terminal 2 — frontend:**
```bash
npm --prefix client run dev
```
Website: http://localhost:5173

## Real-time behavior

- The backend starts a monitoring cycle every 5 seconds and checks each enabled host according to that host's configured interval.
- The browser receives live events over Server-Sent Events (SSE), including host-check updates and newly created alerts.
- The interval is not a promise that every host is probed exactly every 5 seconds; host intervals, probe timeouts, system load, firewall rules, and hosting limits affect timing.
- In-memory mode is suitable for a quick classroom demo, but the data will not survive a backend restart. Configure MongoDB to keep data persistently.

## Configure MongoDB (optional)

Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` to your MongoDB connection string. Never commit credentials or a real `.env` file to a public repository. If MongoDB is not available, the backend falls back to memory storage.

## Build the frontend

```bash
npm run build
```

## Common problems

- **`node` or `npm` is not recognized:** install the Node.js LTS release, then restart VS Code.
- **Port 5000 or 5173 is already in use:** close the other process using that port, then start again.
- **Website opens but data is missing:** check that the backend terminal is running and visit `http://localhost:5000/api/health`.
- **Host shows offline:** verify the IP/hostname, internet access, firewall rules, and whether the destination allows ping/TCP checks.
- **Storage says In-Memory:** this is expected when MongoDB is not configured or cannot be reached; history is temporary.
- **Build/install errors:** remove `client/node_modules` and reinstall with `npm --prefix client install`. Do not copy `node_modules` between different operating systems; install dependencies on the computer where you run the project.

## Project structure

- `client/` — React + Vite dashboard
- `server/` — Express API, monitoring engine, probes, and data storage
- `start-dev.js` — starts the backend and frontend together

## Responsible use

Only monitor hosts and networks that you own or have permission to test. Do not expose the monitoring API to the public internet without adding authentication and suitable access controls.
