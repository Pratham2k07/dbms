import { spawn } from 'child_process';

console.log('================================================================');
console.log('  🚀 STARTING JKLU SHUTTLE TRANSIT SYSTEM (ALL-IN-ONE RUNNER)  ');
console.log('================================================================');
console.log('• Backend API & Socket:  http://localhost:5000');
console.log('• Frontend Web Portal:   http://localhost:5173');
console.log('• Database:              MySQL Server 8.0 (jklu_shuttle_db)');
console.log('================================================================\n');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

// 1. Launch Backend API on port 5000
const backend = spawn(npmCmd, ['run', 'dev', '--prefix', 'backend'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '5000' }
});

// 2. Launch Vite Frontend on port 5173
const frontend = spawn(npxCmd, ['vite', '--host'], {
  stdio: 'inherit',
  shell: true
});

const cleanup = () => {
  console.log('\n🛑 Stopping all services...');
  try { backend.kill(); } catch {}
  try { frontend.kill(); } catch {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

