import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface EventSetting {
  eventId: string;
  isBlocked: boolean;
}

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'private-event-settings.json');

// 設定ファイルが存在することを確認し、なければ作成
const ensureSettingsFile = () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ settings: {} }));
  }
};

export async function GET() {
  try {
    ensureSettingsFile();
    const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    const settings = JSON.parse(data);
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to read private event settings:', error);
    return NextResponse.json({ settings: {} }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { eventId, isBlocked }: EventSetting = await request.json();
    
    if (!eventId || typeof isBlocked !== 'boolean') {
      return NextResponse.json(
        { error: 'eventId and isBlocked are required' }, 
        { status: 400 }
      );
    }

    ensureSettingsFile();
    
    // 現在の設定を読み込み
    const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    const currentSettings = JSON.parse(data);
    
    // 設定を更新
    currentSettings.settings[eventId] = isBlocked;
    
    // ファイルに保存
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(currentSettings, null, 2));
    
    return NextResponse.json({ success: true, settings: currentSettings.settings });
  } catch (error) {
    console.error('Failed to save private event setting:', error);
    return NextResponse.json(
      { error: 'Failed to save setting' }, 
      { status: 500 }
    );
  }
}

// 設定をリセット（開発用）
export async function DELETE() {
  try {
    ensureSettingsFile();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ settings: {} }));
    return NextResponse.json({ success: true, message: 'All settings cleared' });
  } catch (error) {
    console.error('Failed to clear private event settings:', error);
    return NextResponse.json(
      { error: 'Failed to clear settings' },
      { status: 500 }
    );
  }
}