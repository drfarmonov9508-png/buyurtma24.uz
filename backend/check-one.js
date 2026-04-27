const path = process.argv[2];
const fetch = global.fetch;
(async () => {
  const loginRes = await fetch('http://localhost:3000/v1/auth/staff/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+998901234567', password: 'Admin123!' }),
  });
  const login = await loginRes.json();
  const token = login.data.accessToken;
  const res = await fetch(`http://localhost:3000${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  console.log(res.status, text);
})();
