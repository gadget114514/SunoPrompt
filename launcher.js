#!/usr/bin/env node

/**
 * Suno Prompt Generator Launcher
 * This script launches the Electron application
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const appDir = __dirname;

// Check if npm is available
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

console.log('🎵 Starting Suno Prompt Generator...');
console.log(`📁 Application directory: ${appDir}`);

// Spawn npm start process
const npmProcess = spawn(npmCmd, ['start'], {
  cwd: appDir,
  stdio: 'inherit',
  shell: true
});

npmProcess.on('error', (error) => {
  console.error('❌ Error starting application:', error.message);
  console.error('Make sure npm is installed and in your PATH.');
  process.exit(1);
});

npmProcess.on('exit', (code) => {
  process.exit(code);
});

// Handle process signals
process.on('SIGINT', () => {
  npmProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  npmProcess.kill();
  process.exit(0);
});
