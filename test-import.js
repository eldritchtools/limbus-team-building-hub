// test-import.js
require('source-map-support').install?.();
try {
  require('@eldritchtools/limbus-shared-library');
  console.log('shared lib imported OK');
} catch (e) {
  console.error('IMPORT ERROR (shared lib):', e && e.stack ? e.stack : e);
  process.exit(1);
}