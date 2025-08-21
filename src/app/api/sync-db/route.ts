import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // 1. 测试数据库连接
    await prisma.$connect()
    console.log('数据库连接成功')

    // 2. 检查表是否存在并获取数据
    const tableChecks = {
      members: 0,
      orders: 0,
      follow_ups: 0,
      ai_suggestions: 0
    }

    try {
      tableChecks.members = await prisma.member.count()
      console.log(`Members表: ${tableChecks.members} 条记录`)
    } catch (error) {
      console.error('Members表错误:', error)
    }

    try {
      tableChecks.orders = await prisma.order.count()
      console.log(`Orders表: ${tableChecks.orders} 条记录`)
    } catch (error) {
      console.error('Orders表错误:', error)
    }

    try {
      tableChecks.follow_ups = await prisma.followUp.count()
      console.log(`FollowUps表: ${tableChecks.follow_ups} 条记录`)
    } catch (error) {
      console.error('FollowUps表错误:', error)
    }

    try {
      tableChecks.ai_suggestions = await prisma.aISuggestion.count()
      console.log(`AISuggestions表: ${tableChecks.ai_suggestions} 条记录`)
    } catch (error) {
      console.error('AISuggestions表错误:', error)
    }

    // 3. 如果没有数据，尝试创建示例数据
    if (tableChecks.members === 0) {
      console.log('创建示例会员数据...')
      const member = await prisma.member.create({
        data: {
          name: '测试用户',
          phone: '13800138000',
          address: '北京市朝阳区',
          status: 'ACTIVE',
          activityLevel: 'ACTIVE',
          totalOrders: 1,
          totalAmount: 999.0,
          lastOrderDate: new Date(),
        }
      })
      console.log('创建示例会员成功:', member.id)
    }

    return NextResponse.json({
      success: true,
      message: '数据库同步检查完成',
      data: {
        connected: true,
        tables: tableChecks,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('数据库同步失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      details: error
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}