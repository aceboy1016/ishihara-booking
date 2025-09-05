import { NextRequest, NextResponse } from 'next/server';

interface EventSetting {
  eventId: string;
  isBlocked: boolean;
}

// 簡易的にメモリに保存（実際のプロダクションではデータベースを使用）
const eventSettings: Map<string, boolean> = new Map();

export async function GET() {
  try {
    // 設定を取得
    const settings: Record<string, boolean> = {};
    eventSettings.forEach((isBlocked, eventId) => {
      settings[eventId] = isBlocked;
    });
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching event settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { eventId, isBlocked }: EventSetting = await request.json();
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }
    
    // 設定を保存
    eventSettings.set(eventId, isBlocked);
    
    return NextResponse.json({ 
      success: true, 
      eventId, 
      isBlocked 
    });
  } catch (error) {
    console.error('Error updating event setting:', error);
    return NextResponse.json(
      { error: 'Failed to update event setting' },
      { status: 500 }
    );
  }
}

// 設定をリセット（開発用）
export async function DELETE() {
  try {
    eventSettings.clear();
    return NextResponse.json({ success: true, message: 'All settings cleared' });
  } catch (error) {
    console.error('Error clearing settings:', error);
    return NextResponse.json(
      { error: 'Failed to clear settings' },
      { status: 500 }
    );
  }
}