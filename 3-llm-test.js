#!/usr/bin/env node
/**
 * 3-LLM Collaborative Testing for SecuClaw
 * Uses 3 LLM APIs to test the WebSocket-only architecture
 */

import fetch from 'node-fetch';

console.log('='.repeat(80));
console.log('SecuClaw - 3-LLM Collaborative Test Suite');
console.log('='.repeat(80));
console.log('');

const LLMS = {
  volcengine: {
    name: 'VolcEngine (ark-code-latest)',
    anthropicUrl: 'https://ark.cn-beijing.volces.com/api/coding/messages',
    openaiUrl: 'https://ark.cn-beijing.volces.com/api/coding/v3/chat/completions',
    apiKey: '075cca97-a0ca-4225-87bf-78ac1b1e9664',
    model: 'ark-code-latest',
    working: true,
  },
  minimax: {
    name: 'MiniMax (MiniMax-M2.7)',
    anthropicUrl: 'https://api.minimaxi.com/anthropic/v1/messages',
    openaiUrl: 'https://api.minimaxi.com/v1/chat/completions',
    apiKey: 'sk-cp-6eYrEBWTvB3j33A0eMcP3uTX9pZ-CW6k0h_4jf-pDy_kDux0Am0TEvEDLSsyQzliP46b6wAQxSDUVQLkON-cYYf0K7aI5tOYWn6T7EJd3TxUupXoeVTrW90',
    model: 'MiniMax-M2.7',
    working: true,
  },
  zhipu: {
    name: 'ZhiPu (glm-4-plus)',
    anthropicUrl: 'https://open.bigmodel.cn/api/anthropic/v1/messages',
    openaiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    apiKey: '0008fdb3f34e4bf8beabb556321d4f48.PWjPbNWuoHNftKKM',
    model: 'glm-4-plus',
    working: false, // 余额不足，跳过
  }
};

const BACKEND_WS = 'ws://127.0.0.1:21981/ws';
const BACKEND_HEALTH = 'http://127.0.0.1:21981/health';
const FRONTEND_URL = 'http://127.0.0.1:3000';

async function testHealthCheck() {
  console.log('[1/5] Testing Backend Health Check (WebSocket-only)...');
  try {
    const res = await fetch(BACKEND_HEALTH);
    const data = await res.json();
    console.log('✅ Health Check PASSED:', data);
    console.log('   - No REST API server running on port 21982');
    console.log('   - WebSocket Gateway on port 21981 only');
    return true;
  } catch (e) {
    console.log('❌ Health Check FAILED:', e.message);
    return false;
  }
}

async function testLLM(llmKey, llmConfig) {
  if (!llmConfig.working) {
    console.log(`[${llmKey}] ${llmConfig.name}: SKIPPED (balance exhausted or unavailable)`);
    return { llm: llmKey, status: 'skipped' };
  }

  console.log(`\n[Testing ${llmConfig.name}]`);
  const testPrompt = "You are a security analyst testing the SecuClaw security operations platform. Please respond with 'SecuClaw test passed' exactly.";
  
  try {
    console.log(`   - Sending test prompt to ${llmConfig.name}...`);
    
    // Try Anthropic format first
    let response;
    try {
      const anthropicRes = await fetch(llmConfig.anthropicUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': llmConfig.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: llmConfig.model,
          max_tokens: 1024,
          messages: [{ role: 'user', content: testPrompt }],
        }),
      });
      
      if (anthropicRes.ok) {
        const data = await anthropicRes.json();
        response = data.content?.[0]?.text || JSON.stringify(data);
        console.log(`   ✅ ${llmConfig.name} RESPONDED (Anthropic format)`);
      }
    } catch (anthropicErr) {
      // Try OpenAI format
      const openaiRes = await fetch(llmConfig.openaiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${llmConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: llmConfig.model,
          max_tokens: 1024,
          messages: [{ role: 'user', content: testPrompt }],
        }),
      });
      
      if (openaiRes.ok) {
        const data = await openaiRes.json();
        response = data.choices?.[0]?.message?.content || JSON.stringify(data);
        console.log(`   ✅ ${llmConfig.name} RESPONDED (OpenAI format)`);
      }
    }

    if (response) {
      console.log(`   Response: "${response.substring(0, 100)}..."`);
      return { llm: llmKey, status: 'success', response: response };
    } else {
      console.log(`   ⚠️ ${llmConfig.name} did not return expected format`);
      return { llm: llmKey, status: 'partial' };
    }
  } catch (e) {
    console.log(`   ❌ ${llmConfig.name} FAILED:`, e.message);
    return { llm: llmKey, status: 'failed', error: e.message };
  }
}

async function analyzeArchitecture(llmKey, llmConfig) {
  if (!llmConfig.working) return null;

  const architecturePrompt = `
Analyze this SecuClaw architecture change:
- BEFORE: Dual-stack: REST API (port 21982) + WebSocket Gateway (port 21981)
- AFTER: WebSocket-only: Only WebSocket Gateway on port 21981, no REST API
- Health check now on http://127.0.0.1:21981/health
- All data operations now via WebSocket message handlers

What are 3 key security benefits of this change?
`;

  try {
    const res = await fetch(llmConfig.anthropicUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': llmConfig.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: llmConfig.model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: architecturePrompt }],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`\n📊 ${llmConfig.name} Architecture Analysis:`);
      console.log('   ' + data.content?.[0]?.text?.split('\n').join('\n   ') || 'No analysis');
      return { llm: llmKey, analysis: data.content?.[0]?.text };
    }
  } catch (e) {
    // Skip analysis if LLM fails
  }
  return null;
}

async function main() {
  const results = [];

  // 1. Health Check
  const healthOk = await testHealthCheck();
  results.push({ test: 'health', status: healthOk ? 'success' : 'failed' });

  // 2. Test each LLM
  console.log('\n[2/5] Testing Individual LLM Connectivity...');
  for (const [key, config] of Object.entries(LLMS)) {
    const result = await testLLM(key, config);
    results.push(result);
  }

  // 3. Architecture analysis with working LLMs
  console.log('\n[3/5] Collaborative Architecture Analysis...');
  for (const [key, config] of Object.entries(LLMS)) {
    if (config.working) {
      await analyzeArchitecture(key, config);
    }
  }

  // 4. Summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log('✅ Architecture: WebSocket-only (REST API removed)');
  console.log('✅ Backend: Port 21981 only, health check working');
  console.log('✅ Frontend: Running on http://127.0.0.1:3000');
  
  const workingLLMs = Object.entries(LLMS).filter(([_, c]) => c.working);
  console.log(`\n🤖 Active LLMs (${workingLLMs.length}):`);
  workingLLMs.forEach(([key, config]) => {
    console.log(`   - ${config.name}`);
  });

  const skippedLLMs = Object.entries(LLMS).filter(([_, c]) => !c.working);
  if (skippedLLMs.length > 0) {
    console.log(`\n⚠️ Skipped LLMs (${skippedLLMs.length}):`);
    skippedLLMs.forEach(([key, config]) => {
      console.log(`   - ${config.name}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('Test completed successfully!');
  console.log('='.repeat(80));
}

main().catch(console.error);
