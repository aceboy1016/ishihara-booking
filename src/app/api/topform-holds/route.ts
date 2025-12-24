import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const SETTINGS_KEY = 'topform-hold-settings';

// GET: 設定を取得
export async function GET() {
  try {
    const settings = await kv.get(SETTINGS_KEY);
    return NextResponse.json(settings || { settings: {} });
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

    // 現在の設定を読み込み (存在しない場合は空のオブジェクト)
    const currentSettings: { settings: Record<string, boolean> } = await kv.get(SETTINGS_KEY) || { settings: {} };

    // 設定を更新
    currentSettings.settings[eventId] = isIgnored;

    // KVに保存
    await kv.set(SETTINGS_KEY, currentSettings);

    return NextResponse.json({ success: true, settings: currentSettings.settings });
  } catch (error) {
    console.error('Failed to save TOPFORM hold setting:', error);
    return NextResponse.json(
      { error: 'Failed to save setting' },
      { status: 500 }
    );
  }
}

// 設定をリセット（開発用）
export async function DELETE() {
  try {
    await kv.del(SETTINGS_KEY);
    return NextResponse.json({ success: true, message: 'All settings cleared' });
  } catch (error) {
    console.error('Failed to clear TOPFORM hold settings:', error);
    return NextResponse.json(
      { error: 'Failed to clear settings' },
      { status: 500 }
    );
  }
}