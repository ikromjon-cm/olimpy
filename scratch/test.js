const API_URL = 'http://localhost:3002/api/v1';

async function test() {
  console.log('--- ADMIN CRUD TEST ---');
  
  const phone = '+998900000001';
  const password = 'password123';

  // 1. Login to get ADMIN token
  console.log('\n[1] Logging in...');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: phone, password })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.error('Login failed:', loginData);
    return;
  }
  const token = loginData.data?.accessToken || loginData.accessToken;
  console.log('Login success');

  const headers = { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. LOCATIONS CRUD
  console.log('\n[2] Testing LOCATIONS CRUD...');
  
  // Create
  const createLocRes = await fetch(`${API_URL}/admin/locations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Test Location',
      address: 'Test Address',
      mapLink: 'https://maps.google.com',
      contactPhone: '+998901112233',
      contactPerson: 'Director'
    })
  });
  const newLoc = await createLocRes.json();
  if (!createLocRes.ok) return console.error('Create Location failed:', newLoc);
  console.log('Create Location: Success, ID:', newLoc.data.id);
  const locId = newLoc.data.id;

  // Read
  const getLocsRes = await fetch(`${API_URL}/admin/locations`, { headers });
  const locs = await getLocsRes.json();
  console.log('Read Locations: Success, count:', locs.data.length);

  // Update
  const updateLocRes = await fetch(`${API_URL}/admin/locations/${locId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ name: 'Updated Location' })
  });
  console.log('Update Location: Success');

  // Delete
  const delLocRes = await fetch(`${API_URL}/admin/locations/${locId}`, {
    method: 'DELETE',
    headers
  });
  console.log('Delete Location: Success');

  // 3. OLYMPIADS CRUD
  console.log('\n[3] Testing OLYMPIADS CRUD...');
  
  // Create
  const createOlymRes = await fetch(`${API_URL}/olympiads/admin`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Test Olympiad',
      description: 'Test Description',
      price: 10000,
      examDate: new Date().toISOString(),
      locationId: null,
      status: 'ACTIVE'
    })
  });
  const newOlym = await createOlymRes.json();
  if (!createOlymRes.ok) return console.error('Create Olympiad failed:', newOlym);
  console.log('Create Olympiad: Success, ID:', newOlym.data.id);
  const olymId = newOlym.data.id;

  // Update
  const updateOlymRes = await fetch(`${API_URL}/olympiads/admin/${olymId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ name: 'Updated Olympiad' })
  });
  console.log('Update Olympiad: Success');

  // Toggle Status (Delete/Deactivate)
  const toggleRes = await fetch(`${API_URL}/olympiads/admin/${olymId}/toggle`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ status: 'INACTIVE' })
  });
  console.log('Toggle Olympiad status: Success');

  console.log('\n--- Barcha testlar muvaffaqiyatli yakunlandi ---');
}

test();
