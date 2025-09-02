import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    // 環境変数からパスワードを取得、フォールバックを設定
    const validPassword = process.env.LOGIN_PASSWORD || 'ishihara2025';
    
    if (password === validPassword) {
      return NextResponse.json({ success: true });
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