import { spawn } from 'node:child_process';

const children = [
  spawn(process.execPath, ['server/index.mjs'], {
    env: { ...process.env, PORT: '3001', HOST: '127.0.0.1' },
    stdio: 'inherit',
  }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'vite.config.ts'], {
    stdio: 'inherit',
  }),
];

let stopping = false;
const stop = (code = 0) => {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => child.kill());
  process.exitCode = code;
};

children.forEach((child) => child.on('exit', (code) => stop(code ?? 1)));
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
