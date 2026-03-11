// Main entry point for SecuClaw Frontend

// Disable Lit dev mode warnings in development
(window as any).litDisableDevModeWarning = true;

import '@vaadin/router';

import { initI18n } from './i18n/index.js';
import { gatewayClient } from './ui/gateway-client.js';
import { uiStore } from './ui/store/ui-store.js';
import { commanderStore } from './ui/store/commander-store.js';
import { skillStore } from './ui/store/skill-store.js';

async function bootstrap() {
  console.log('[SecuClaw] Bootstrapping application...');
  
  try {
    // Connect to gateway FIRST (before loading app components)
    // This ensures connection is ready when pages load
    gatewayClient.connect().catch(err => {
      console.warn('[SecuClaw] Gateway connection failed, will retry:', err);
    });
    console.log('[SecuClaw] Gateway connection initiated');
    
    // Initialize i18n (before loading app components)
    await initI18n();
    console.log('[SecuClaw] i18n initialized');
    
    // Now import and render the app (translations are ready)
    await import('./ui/app.js');
    
    // Initialize stores
    await Promise.all([
      uiStore.initialize(),
      commanderStore.initialize(),
      skillStore.initialize(),
    ]);
    console.log('[SecuClaw] Stores initialized');
    
  } catch (error) {
    console.error('[SecuClaw] Bootstrap failed:', error);
  }
}

bootstrap();
