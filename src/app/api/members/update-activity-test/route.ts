import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('测试API调用');
    
    return NextResponse.json({
      success: true,
      message: '测试API正常工作',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('测试API失败:', error);
    return NextResponse.json(
      { success: false, message: `测试API失败: ${error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error'}` },
      { status: 500 }
    );
  }
}