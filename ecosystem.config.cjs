module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: './backend',
      script: 'artisan',
      args: 'serve --host=127.0.0.1 --port=8000',
      interpreter: 'php',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000,
    },
    {
      name: 'frontend',
      cwd: './frontend',
      script: 'node_modules/.bin/ng',
      args: 'serve --proxy-config proxy.conf.json --port 4200',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000,
    },
  ],
};
