module.exports = {
  apps: [{
    name: 'pingping',
    script: 'server.js',
    instances: 1, // Single instance is optimal for SQLite local engine with WAL mode
    autorestart: true,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 8080
    }
  }]
};
