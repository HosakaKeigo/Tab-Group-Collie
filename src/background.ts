import { ExtensionManager } from './core/ExtensionManager';

// ExtensionManagerのシングルトンインスタンスを取得
const extensionManager = ExtensionManager.getInstance();

// 拡張機能のインストール時の処理
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await extensionManager.handleInstall();
  }
});

// ExtensionManagerを初期化
extensionManager.initialize().catch(error => {
  console.error('❌ Failed to initialize ExtensionManager:', error);
});