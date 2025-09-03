import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    // 管理者モードのパスワード
    const adminPassword = 'junnya1016?';
    
    if (password === adminPassword) {
      return NextResponse.json({ success: true, isAdmin: true });
    } else {
      return NextResponse.json(
        { message: 'パスワードが正しくありません' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: '認証中にエラーが発生しました' },
      { status: 500 }
    );
  }
}