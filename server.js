const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
let port = 3000; // Bevorzugter Port 3000

// Funktion zum Starten des Servers mit einem bestimmten Port
const startServer = (port) => {
  app.prepare().then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(port, '127.0.0.1', (err) => {
      if (err) throw err;
      console.log(`> Server läuft auf http://localhost:${port}`);
    });
  });
};

// Prüfen, ob der Port bereits verwendet wird
const net = require('net');
const server = net.createServer();

server.once('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${port} ist bereits in Verwendung. Versuche Port 3001...`);
    port = 3001;
    startServer(port);
  }
});

server.once('listening', () => {
  // Port ist frei, schließe den Testserver und starte den eigentlichen Server
  server.close(() => {
    startServer(port);
  });
});

// Teste, ob der Port frei ist
server.listen(port);
