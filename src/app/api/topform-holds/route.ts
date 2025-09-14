import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'topform-hold-settings.json');

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

// GET: 設定を取得
export async function GET() {
  try {
    ensureSettingsFile();
    const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    const settings = JSON.parse(data);
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to read TOPFORM hold settings:', error);
    return NextResponse.json({ settings: {} }, { status: 200 });
  }
}

// POST: 設定を保存
export async function POST(request: NextRequest) {
  try {
    const { eventId, isIgnored } = await request.json();
    
    if (!eventId || typeof isIgnored !== 'boolean') {
      return NextResponse.json(
        { error: 'eventId and isIgnored are required' }, 
        { status: 400 }
      );
    }

    ensureSettingsFile();
    
    // 現在の設定を読み込み
    const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    const currentSettings = JSON.parse(data);
    
    // 設定を更新
    currentSettings.settings[eventId] = isIgnored;
    
    // ファイルに保存
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(currentSettings, null, 2));
    
    return NextResponse.json({ success: true, settings: currentSettings.settings });
  } catch (error) {
    console.error('Failed to save TOPFORM hold setting:', error);
    return NextResponse.json(
      { error: 'Failed to save setting' }, 
      { status: 500 }
    );
  }
}