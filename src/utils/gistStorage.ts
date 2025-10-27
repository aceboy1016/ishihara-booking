interface PrivateEventSettings {
  settings: Record<string, boolean>;
}

export class GistStorage {
  // 設定をGistに保存
  static async saveSettings(settings: PrivateEventSettings): Promise<string> {
    try {
      const gistData = {
        description: "石原トレーナー予約設定 - Private Event Settings",
        public: false, // Secret Gist
        files: {
          "private-event-settings.json": {
            content: JSON.stringify(settings, null, 2)
          }
        }
      };

      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gistData)
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const result = await response.json();
      return result.html_url; // GistのURL
    } catch (error) {
      console.error('Failed to save settings to Gist:', error);
      throw error;
    }
  }

  // GistIDから設定を読み込み
  static async loadSettings(gistId: string): Promise<PrivateEventSettings> {
    try {
      const response = await fetch(`https://api.github.com/gists/${gistId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch Gist: ${response.status}`);
      }

      const gist = await response.json();
      const file = gist.files['private-event-settings.json'];

      if (!file) {
        throw new Error('Settings file not found in Gist');
      }

      return JSON.parse(file.content);
    } catch (error) {
      console.error('Failed to load settings from Gist:', error);
      throw error;
    }
  }

  // URLからGistIDを抽出
  static extractGistId(url: string): string | null {
    const match = url.match(/gist\.github\.com\/[^\/]+\/([a-f0-9]+)/);
    return match ? match[1] : null;
  }
}