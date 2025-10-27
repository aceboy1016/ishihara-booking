import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';

interface EventSetting {
  eventId: string;
  isBlocked: boolean;
}

const SETTINGS_FILE = join(process.cwd(), 'data', 'private-event-settings.json');

async function ensureDataDir() {
  try {
    await mkdir(join(process.cwd(), 'data'), { recursive: true });
  } catch (error) {
    // Directory already exists, ignore
  }
}

async function readSettings() {
  try {
    const data = await readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { settings: {} };
  }
}

async function writeSettings(settings: any) {
  await ensureDataDir();
  await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

export async function GET() {
  try {
    const settings = await readSettings();
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

    // 現在の設定を読み込み
    const currentSettings = await readSettings();

    // 設定を更新
    currentSettings.settings[eventId] = isBlocked;

    // ファイルに保存
    await writeSettings(currentSettings);

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
    await writeSettings({ settings: {} });
    return NextResponse.json({ success: true, message: 'All settings cleared' });
  } catch (error) {
    console.error('Failed to clear private event settings:', error);
    return NextResponse.json(
      { error: 'Failed to clear settings' },
      { status: 500 }
    );
  }
}
