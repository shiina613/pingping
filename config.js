const testConfig = window.__PINGPING_TEST_CONFIG__ || {};
window.PINGPING_CONFIG = Object.freeze({
  supabaseUrl: testConfig.supabaseUrl || 'https://fkambrjgfgeppolbjbpg.supabase.co',
  supabaseKey: testConfig.supabaseKey || 'sb_publishable_hQrmRoDzu44kbgFKY5FgJw_MIriO0MI'
});
