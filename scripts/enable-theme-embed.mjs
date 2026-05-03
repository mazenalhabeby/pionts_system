#!/usr/bin/env node
/**
 * Enable the Pionts theme app embed block directly via Shopify Admin API.
 *
 * Usage: node scripts/enable-theme-embed.mjs
 *
 * Reads the access token from the database via the debug endpoint,
 * then directly patches the theme's settings_data.json to enable
 * any disabled loyalty-popup block.
 */

const SHOP = process.argv[2] || 'happayly-dev-store.myshopify.com';
const API_VERSION = '2024-01';

// Read the installation from our backend's debug endpoint
const API_BASE = process.env.API_BASE || 'https://hbc-solution.io/v2';

async function main() {
  console.log(`\n🔧 Enabling theme embed for: ${SHOP}\n`);

  // 1. Get installation info from our debug endpoint
  const debugRes = await fetch(`${API_BASE}/shopify/debug-embed?shop=${SHOP}`);
  const debug = await debugRes.json();

  if (!debug.installationExists) {
    console.error('❌ No installation found for this shop');
    process.exit(1);
  }

  const themeId = debug.themeBlocks?.themeId;
  const appBlocks = debug.themeBlocks?.appBlocks || [];

  console.log(`  Theme: ${debug.themeBlocks?.themeName} (${themeId})`);
  console.log(`  App blocks found: ${appBlocks.length}`);

  if (appBlocks.length === 0) {
    console.log('❌ No app blocks in theme. The extension may not be installed.');
    process.exit(1);
  }

  // Check if any are disabled
  const disabledBlocks = appBlocks.filter(b => b.disabled);
  if (disabledBlocks.length === 0) {
    console.log('✅ All blocks are already enabled!');
    process.exit(0);
  }

  console.log(`  Disabled blocks: ${disabledBlocks.length}`);
  for (const b of disabledBlocks) {
    console.log(`    - ${b.blockId}: ${b.type}`);
  }

  // 2. The fix endpoint will use the backend's enableThemeAppEmbed
  //    After deploying the fixed code, this will work:
  console.log('\n  Attempting to enable via fix endpoint...');
  const fixRes = await fetch(`${API_BASE}/shopify/debug-embed?shop=${SHOP}&fix=true`);
  const fixData = await fixRes.json();

  // 3. Verify
  const verifyRes = await fetch(`${API_BASE}/shopify/debug-embed?shop=${SHOP}`);
  const verify = await verifyRes.json();
  const stillDisabled = (verify.themeBlocks?.appBlocks || []).filter(b => b.disabled);

  if (stillDisabled.length === 0) {
    console.log('\n✅ Theme embed enabled successfully!');
    console.log(`   Visit https://${SHOP} to see the floating widget.`);
  } else {
    console.log('\n⚠️  Block still disabled. Server needs the updated matching code.');
    console.log('   Deploy the latest backend, then run this again.');
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
