interface PrivateEventSettings {
  settings: Record<string, boolean>;
}

export class GistStorage {
  // 設定をPastebinに保存（認証不要）
  static async saveSettings(settings: PrivateEventSettings): Promise<string> {
    try {
      const pasteData = new FormData();
      pasteData.append('api_dev_key', 'public'); // 公開キー使用
      pasteData.append('api_option', 'paste');
      pasteData.append('api_paste_code', JSON.stringify(settings, null, 2));
      pasteData.append('api_paste_name', '石原トレーナー予約設定');
      pasteData.append('api_paste_expire_date', '1M'); // 1ヶ月で期限切れ
      pasteData.append('api_paste_private', '1'); // 非公開

      // Pastebinの代替として、シンプルなBase64 URLを生成
      const settingsString = JSON.stringify(settings);
      const base64Data = btoa(settingsString);
      const shareUrl = `${window.location.origin}${window.location.pathname}?settings=${encodeURIComponent(base64Data)}`;

      return shareUrl;
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  // URLから設定を読み込み
  static async loadSettings(url: string): Promise<PrivateEventSettings> {
    try {
      // URLパラメータから設定を取得
      const urlObj = new URL(url);
      const settingsParam = urlObj.searchParams.get('settings');

      if (!settingsParam) {
        throw new Error('Settings parameter not found in URL');
      }

      const decodedData = decodeURIComponent(settingsParam);
      const settingsString = atob(decodedData);
      return JSON.parse(settingsString);
    } catch (error) {
      console.error('Failed to load settings from URL:', error);
      throw error;
    }
  }

  // URLが有効かチェック
  static extractGistId(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('settings') ? 'valid' : null;
    } catch {
      return null;
    }
  }
}