/**
 * Dashboard C (Design) - Functional Test
 * Tests Supabase connectivity and basic operations
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yvnshlomzgcynphkqoaj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Cl9ukdETem9EWh2p0wkmpg_7Tdz-_4F';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTests() {
  console.log('='.repeat(60));
  console.log('Dashboard C (Design) - Functional Test Suite');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  // Test 1: Connection
  console.log('\n[TEST 1] Supabase Connection...');
  try {
    const { error } = await supabase.from('usuarios').select('count').limit(1);
    if (error) throw error;
    console.log('  ✓ Connected to Supabase');
    passed++;
  } catch (err) {
    console.log('  ✗ Connection failed:', err.message);
    failed++;
  }

  // Test 2: Usuarios table
  console.log('\n[TEST 2] Usuarios Table...');
  try {
    const { data, error } = await supabase.from('usuarios').select('id, nombre, rol').limit(5);
    if (error) throw error;
    console.log(`  ✓ Found ${data.length} users`);
    if (data.length > 0) console.log(`    Sample: ${data[0].nombre} (${data[0].rol})`);
    passed++;
  } catch (err) {
    console.log('  ✗ Usuarios query failed:', err.message);
    failed++;
  }

  // Test 3: Solicitudes table
  console.log('\n[TEST 3] Solicitudes Table...');
  try {
    const { data, error } = await supabase.from('solicitudes').select('id, cliente, producto').eq('is_deleted', false).limit(5);
    if (error) throw error;
    console.log(`  ✓ Found ${data.length} active solicitudes`);
    if (data.length > 0) console.log(`    Sample: ${data[0].cliente} - ${data[0].producto}`);
    passed++;
  } catch (err) {
    console.log('  ✗ Solicitudes query failed:', err.message);
    failed++;
  }

  // Test 4: Estados_solicitud table
  console.log('\n[TEST 4] Estados Solicitud Table...');
  try {
    const { data, error } = await supabase.from('estados_solicitud').select('id, estado, timestamp').order('timestamp', { ascending: false }).limit(5);
    if (error) throw error;
    console.log(`  ✓ Found ${data.length} status events`);
    if (data.length > 0) console.log(`    Latest: ${data[0].estado} at ${new Date(data[0].timestamp).toLocaleString()}`);
    passed++;
  } catch (err) {
    console.log('  ✗ Estados query failed:', err.message);
    failed++;
  }

  // Test 5: Notificaciones table
  console.log('\n[TEST 5] Notificaciones Table...');
  try {
    const { data, error } = await supabase.from('notificaciones').select('id, titulo, tipo').limit(5);
    if (error) throw error;
    console.log(`  ✓ Found ${data.length} notifications`);
    passed++;
  } catch (err) {
    console.log('  ✗ Notificaciones query failed:', err.message);
    failed++;
  }

  // Test 6: Join query (solicitudes + usuarios)
  console.log('\n[TEST 6] Join Query (Solicitudes with Asesor)...');
  try {
    const { data, error } = await supabase
      .from('solicitudes')
      .select('id, cliente, producto, asesor:usuarios!asesor_id(nombre)')
      .eq('is_deleted', false)
      .limit(3);
    if (error) throw error;
    console.log(`  ✓ Join query successful`);
    if (data.length > 0) {
      const sample = data[0];
      console.log(`    Sample: ${sample.cliente} - ${sample.producto} (Asesor: ${sample.asesor?.nombre || 'N/A'})`);
    }
    passed++;
  } catch (err) {
    console.log('  ✗ Join query failed:', err.message);
    failed++;
  }

  // Test 7: Storage bucket
  console.log('\n[TEST 7] Storage Bucket (design-attachments)...');
  try {
    const { data, error } = await supabase.storage.from('design-attachments').list('', { limit: 1 });
    if (error) throw error;
    console.log('  ✓ Storage bucket accessible');
    passed++;
  } catch (err) {
    console.log('  ✗ Storage access failed:', err.message);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
