import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('环境变量 DATABASE_URL:', process.env.DATABASE_URL ? '存在' : '不存在')
    console.log('环境变量 DIRECT_DATABASE_URL:', process.env.DIRECT_DATABASE_URL ? '存在' : '不存在')
    
    // 测试数据库连接
    await prisma.$connect()
    console.log('数据库连接成功')
    
    // 查询会员数量
    const memberCount = await prisma.member.count()
    console.log('会员数量:', memberCount)
    
    // 查询订单数量
    const orderCount = await prisma.order.count()
    console.log('订单数量:', orderCount)
    
    // 查询前3个会员
    const members = await prisma.member.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        phone: true
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        memberCount,
        orderCount,
        members,
        env: {
          hasDbUrl: !!process.env.DATABASE_URL,
          hasDirectUrl: !!process.env.DIRECT_DATABASE_URL
        }
      }
    })
    
  } catch (error) {
    console.error('数据库测试失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        hasDirectUrl: !!process.env.DIRECT_DATABASE_URL
      }
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}