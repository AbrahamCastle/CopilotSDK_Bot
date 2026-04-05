#!/usr/bin/env node

/**
 * Script para probar la conexión con Copilot SDK
 * Ejecutar: npx tsx scripts/test-copilot.ts
 */

import { CopilotClient } from '@github/copilot-sdk';

async function testCopilot() {
  console.log('🧪 Testing Copilot SDK connection...\n');

  try {
    console.log('1️⃣ Starting Copilot client...');
    const client = new CopilotClient();
    await client.start();
    console.log('   ✅ Client started\n');

    console.log('2️⃣ Creating session...');
    const session = await client.createSession({
      model: 'claude-sonnet-4.5',
      streaming: false,
    });
    console.log('   ✅ Session created\n');

    console.log('3️⃣ Sending test message...');
    const response = await session.sendAndWait({
      prompt: 'What is 2 + 2? Answer with just the number.',
    });
    console.log(`   ✅ Response: ${response?.data.content}\n`);

    console.log('4️⃣ Stopping client...');
    await client.stop();
    console.log('   ✅ Client stopped\n');

    console.log('✨ All tests passed! Copilot SDK is working correctly.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('\nTroubleshooting:');
    console.error('  - Make sure Copilot CLI is installed: copilot --version');
    console.error('  - Make sure you are authenticated: gh auth status');
    console.error('  - Make sure you have a Copilot subscription');
    process.exit(1);
  }
}

testCopilot();
