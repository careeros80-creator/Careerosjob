/**
 * tests/pilot/test_profile_link.js — static guards for the profile-link bugfix.
 * (Behavioural DB proof lives in scripts/pilot_profile_link_test.sh, run against
 * the live DB during verification.) Run: node tests/pilot/test_profile_link.js
 */
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };

const mig = fs.readFileSync(path.join(__dirname, '..', '..', 'migrations', '023_pilot_profile_link.sql'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '..', '..', 'dashboard', 'src', 'App.jsx'), 'utf8');

console.log('\n[ migration 023: link_pilot_profile() ]');
check(/CREATE OR REPLACE FUNCTION public\.link_pilot_profile\(\)/.test(mig), 'defines link_pilot_profile()');
check(/SECURITY DEFINER/.test(mig), 'SECURITY DEFINER (can bypass RLS to link the seeded row)');
check(/SET search_path = public/.test(mig), 'pins search_path (definer-safety)');
check(/GRANT EXECUTE ON FUNCTION public\.link_pilot_profile\(\) TO authenticated/.test(mig), 'granted to authenticated only');
check(/REVOKE ALL ON FUNCTION public\.link_pilot_profile\(\) FROM PUBLIC/.test(mig), 'revoked from PUBLIC');

console.log('\n[ link-not-duplicate ordering ]');
const iExisting = mig.indexOf('WHERE auth_uid = v_uid');       // (1) already linked
const iUpdate = mig.indexOf('UPDATE pilot_profile');           // (2) link seeded
const iInsert = mig.indexOf('INSERT INTO pilot_profile');      // (3) create only if none
check(iExisting > -1 && iUpdate > -1 && iInsert > -1, 'all three branches present');
check(iExisting < iUpdate && iUpdate < iInsert, 'order: return-existing → link-seeded → insert-new');
check(/WHERE auth_uid IS NULL ORDER BY created_at LIMIT 1/.test(mig), 'links the existing unlinked seeded profile (UPDATE, preserves FKs)');
check(/RETURN v_profile_id;/.test(mig), 'idempotent early-return of existing profile id');

console.log('\n[ client: ensureProfile links via RPC, never inserts a duplicate ]');
check(/supabase\.rpc\('link_pilot_profile'\)/.test(app), "ensureProfile calls supabase.rpc('link_pilot_profile')");
check(!/from\('pilot_profile'\)\.insert\(/.test(app), 'client no longer inserts pilot_profile directly (no duplicate path)');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
