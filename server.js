const { createServer } = require('http');
const next = require('next');

const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res))
    .listen(process.env.PORT || 3000); // en iisnode PORT es un named pipe
});
