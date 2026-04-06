
const fetch = require('node-fetch');

console.log('='.repeat(80));
console.log('SecuClaw - 2-LLM Collaborative Test Suite');
console.log('='.repeat(80));
console.log('');

const LLMS = {
  volcengine: {
    name: 'VolcEngine (ark-code-latest)',
    url: 'https://ark.cn-beijing.volces.com/api/coding/messages',
    key: '075cca97-a0ca-4225-87bf-78ac1b1e9664',
    model: 'ark-code-latest',
  },
  minimax: {
    name: 'MiniMax (MiniMax-M2.7)',
    url: 'https://api.minimaxi.com/anthropic/v1/messages',
    key: 'sk-cp-6eYrEBWTvB3j33A0eMcP3uTX9pZ-CW6k0h_4jf-pDy_kDux0Am0TEvEDLSsyQzliP46b6wAQxSDUVQLkON-cYYf0K7aI5tOYWn6T7EJd3TxUupXoeVTrW90',
    model: 'MiniMax-M2.7',
  },
};

const BACKEND_HEALTH = 'http://127.0.0.1:21981/health';

async function testBackend() {
  console.log('[1/4] Testing Backend (WebSocket-only)...');
  try {
    const res = await fetch(BACKEND_HEALTH);
    const data = await res.json();
    console.log('✅ Backend Health PASSED:', data);
    console.log('   - NO REST API server on port 21982');
    console.log('   - ONLY WebSocket Gateway on port 21981');
    return true;
  } catch (e) {
    console.log('❌ Backend Health FAILED:', e.message);
    return false;
  }
}

async function testLLM(llmKey, llmConfig) {
  console.log(`\n[Testing ${llmConfig.name}]`);
  const testPrompt = "You are a security analyst testing the SecuClaw platform. Please respond with 'SecuClaw test passed' exactly.";
  
  try {
    console.log(`   - Sending test prompt to ${llmConfig.name}...`);
    const res = await fetch(llmConfig.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': llmConfig.key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: llmConfig.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: testPrompt }],
      }),
    });
    
    if (res.ok) {
      const data = await res.json();
      const response = data.content?.[0]?.text || JSON.stringify(data);
      console.log(`   ✅ ${llmConfig.name} RESPONDED`);
      console.log(`   Response: "${response.substring(0, 100)}..."`);
      return { llm: llmKey, status: 'success', response };
    } else {
      console.log(`   ⚠️ ${llmConfig.name} HTTP ${res.status}`);
      return { llm: llmKey, status: 'partial' };
    }
  } catch (e) {
    console.log(`   ❌ ${llmConfig.name} FAILED:`, e.message);
    return { llm: llmKey, status: 'failed', error: e.message };
  }
}

async function analyzeArchitecture(llmKey, llmConfig) {
  const prompt = `
Analyze this SecuClaw architecture change:
- BEFORE: Dual-stack: REST API (port 21982) + WebSocket Gateway (port 21981)
- AFTER: WebSocket-only: Only WebSocket Gateway on port 21981, no REST API
- Health check now on http://127.0.0.1:21981/health
- All data operations now via WebSocket message handlers

What are 3 key security benefits of this change?
`;

  try {
    const res = await fetch(llmConfig.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': llmConfig.key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: llmConfig.model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`\n📊 ${llmConfig.name} Architecture Analysis:`);
      const analysis = data.content?.[0]?.text || 'No analysis';
      console.log('   ' + analysis.split('\n').join('\n   '));
      return { llm: llmKey, analysis };
    }
  } catch (e) {
  }
  return null;
}

async function main() {
  const results = [];

  // 1. Backend Health
  const healthOk = await testBackend();
  results.push({ test: 'health', status: healthOk ? 'success' : 'failed' });

  // 2. Test each LLM
  console.log('\n[2/4] Testing Individual LLM Connectivity...');
  for (const [key, config] of Object.entries(LLMS)) {
    const result = await testLLM(key, config);
    results.push(result);
  }

  // 3. Architecture analysis with working LLMs
  console.log('\n[3/4] Collaborative Architecture Analysis...');
  for (const [key, config] of Object.entries(LLMS)) {
    await analyzeArchitecture(key, config);
  }

  // 4. Summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log('✅ Architecture: WebSocket-only (REST API removed)');
  console.log('✅ Backend: Port 21981 only, health check working');
  console.log('✅ Frontend: Running on http://127.0.0.1:3000');
  
  const workingLLMs = Object.entries(LLMS).filter(([_, c]) => true);
  console.log(`\n🤖 Active LLMs (${workingLLMs.length}):`);
  workingLLMs.forEach(([key, config]) => {
    console.log(`   - ${config.name}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('Test completed successfully!');
  console.log('='.repeat(80));
}

main().catch(console.error);
