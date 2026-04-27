const http = require('http');
const body = JSON.stringify({ phone: '+998900000000', password: 'Admin123!' });
const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/v1/auth/staff/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
}, (res) => {
  let data = '';
  res.on('data', (d) => (data += d));
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log(data);
  });
});
req.on('error', (e) => {
  console.error('ERR', e.message);
});
req.write(body);
req.end();
