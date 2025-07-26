module.exports = {
  apps: [{
    name: 'barriere-frei24-app',
    script: 'server.js',
    cwd: '/var/www/barriere-frei24-app',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '1G',
    node_args: ['--max-old-space-size=2048'],
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log'
  }]
}; 