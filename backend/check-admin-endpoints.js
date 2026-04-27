const fetch = global.fetch;

async function main() {
  const loginRes = await fetch('http://localhost:3000/v1/auth/staff/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+998901234567', password: 'Admin123!' }),
  });
  const login = await loginRes.json();
  const token = login.data.accessToken;
  const paths = [
    '/v1/categories',
    '/v1/products',
    '/v1/tables',
    '/v1/orders',
    '/v1/users/staff',
    '/v1/inventory',
    '/v1/discounts',
    '/v1/settings',
    '/v1/reports/dashboard',
  ];

  for (const path of paths) {
    try {
      const res = await fetch(`http://localhost:3000${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      console.log(`${path} => ${res.status} ${text.slice(0, 240).replace(/\s+/g, ' ')}`);
    } catch (err) {
      console.log(`${path} => ERR ${err.message}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
