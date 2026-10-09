import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=================================================================');
console.log('🛡️  NetWatch Full-Stack Network Operations Center (NOC) Starting...');
console.log('=================================================================\n');

// 1. Launch Backend Server (Port 5000)
const serverScript = path.join(__dirname, 'server', 'src', 'server.js');
const serverProcess = spawn('node', [serverScript], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: false,
  env: { ...process.env, PORT: '5000' }
});

serverProcess.on('error', (err) => {
  console.error('[Backend] Failed to start:', err);
});

// 2. Launch Frontend Client (Vite on Port 5173)
const clientVite = path.join(__dirname, 'client', 'node_modules', 'vite', 'bin', 'vite.js');
const clientProcess = spawn('node', [clientVite, '--port', '5173'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: false,
});

clientProcess.on('error', (err) => {
  console.error('[Frontend] Failed to start:', err);
});

// Handle termination signals
const shutdown = () => {
  console.log('\n[NetWatch] Shutting down services cleanly...');
  try { serverProcess.kill(); } catch (e) {}
  try { clientProcess.kill(); } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
