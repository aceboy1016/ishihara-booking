import { NextRequest, NextResponse } from 'next/server';

interface EventSetting {
  eventId: string;
  isBlocked: boolean;
}

// Vercelでは永続化された設定保存が困難なため、
// 一時的にセッション内でのメモリベース保存を使用
let memoryStore: { settings: Record<string, boolean> } = { settings: {} };

export async function GET() {
  try {
    return NextResponse.json(memoryStore);
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

    // 設定を更新
    memoryStore.settings[eventId] = isBlocked;

    return NextResponse.json({ success: true, settings: memoryStore.settings });
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
    memoryStore = { settings: {} };
    return NextResponse.json({ success: true, message: 'All settings cleared' });
  } catch (error) {
    console.error('Failed to clear private event settings:', error);
    return NextResponse.json(
      { error: 'Failed to clear settings' },
      { status: 500 }
    );
  }
}
