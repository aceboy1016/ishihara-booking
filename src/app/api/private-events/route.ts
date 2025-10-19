import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

interface EventSetting {
  eventId: string;
  isBlocked: boolean;
}

const SETTINGS_KEY = 'private-event-settings';

export async function GET() {
  try {
    const settings = await kv.get(SETTINGS_KEY);
    return NextResponse.json(settings || { settings: {} });
  } catch (error) {
    console.error('Failed to read private event settings:', error);
    // エラーが発生した場合でも、フロントエンドが壊れないように空の設定を返す
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

    // 現在の設定を読み込み (存在しない場合は空のオブジェクト)
    const currentSettings: { settings: Record<string, boolean> } = await kv.get(SETTINGS_KEY) || { settings: {} };
    
    // 設定を更新
    currentSettings.settings[eventId] = isBlocked;
    
    // KVに保存
    await kv.set(SETTINGS_KEY, currentSettings);

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
    await kv.del(SETTINGS_KEY);
    return NextResponse.json({ success: true, message: 'All settings cleared' });
  } catch (error) {
    console.error('Failed to clear private event settings:', error);
    return NextResponse.json(
      { error: 'Failed to clear settings' },
      { status: 500 }
    );
  }
}
