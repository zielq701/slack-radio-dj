import * as http from 'http';

let app = http.createServer(handler);
app.listen(8888);

function handler(req, res) {
  res.writeHead(200);
  res.end('It works!');
}
