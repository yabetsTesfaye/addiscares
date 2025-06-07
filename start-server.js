// Simple wrapper script to start the server
const { spawn } = require('child_process');
const path = require('path');

// Get the path to the server.js file
const serverPath = path.join(__dirname, 'server.js');

console.log('Starting AddisCare backend server on port 3001...');
console.log('Press Ctrl+C to stop the server');

// Spawn the node process to run server.js
const serverProcess = spawn('node', [serverPath], {
  stdio: 'inherit' // This will show server output in the current console
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server:', err);
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});
