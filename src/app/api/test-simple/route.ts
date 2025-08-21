import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 最简单的连接测试
    const result = await prisma.$queryRaw`SELECT 1 as test;`
    
    return NextResponse.json({
      success: true,
      message: '数据库连接成功',
      result: result,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('连接测试失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '数据库连接失败',
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}