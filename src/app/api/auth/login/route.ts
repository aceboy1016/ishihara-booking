import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    // 管理者ユーザーリスト
    const adminUsers = {
      'junnya1016?': { name: '石原', role: 'オーナー' },
      'admin123': { name: 'スタッフA', role: '管理者' },
      'staff456': { name: 'スタッフB', role: 'スタッフ' }
    };
    
    const user = adminUsers[password as keyof typeof adminUsers];
    
    if (user) {
      return NextResponse.json({ 
        success: true, 
        isAdmin: true,
        user: {
          name: user.name,
          role: user.role,
          loginTime: new Date().toISOString()
        }
      });
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