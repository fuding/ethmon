#!/usr/bin/env node

/**
 * Module dependencies.
 */

const app = require('../app');
const process = require('process');
const debug = require('debug')('nodetest2:server');
const http = require('http');
const path = require('path');
const config = require(path.resolve(__dirname, 'config.json'));

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || 3000);
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Start CORS Anywhere proxy
*/
if (config['cors_anywhere_server']) {
   let cors_proxy = require('cors-anywhere');
   let cors_anywhere_port = normalizePort(port + 1);
   let cors_proxy_server = cors_proxy.createServer({
      originWhiteList: ['http://' + process.env.HOST, 'https://' + process.env.HOST] || function() {
          let os = require('os');
          let nInterfaces = os.networkInterfaces();
          let addrs = [];
          for (interface in nInterfaces) {
              let addr = nInterfaces[interface][0]['address'];
              addrs.push('http://' + addr, 'https://' + addr);
          }
          return addrs;
      },
      requireHeader: ['Origin', 'X-Requested-With'],
      removeHeaders: ['cookie', 'cookie2'],
   });
   // listen on HTTP server port + 1. By default it's 3001
   cors_proxy_server.listen(cors_anywhere_port);
}

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
