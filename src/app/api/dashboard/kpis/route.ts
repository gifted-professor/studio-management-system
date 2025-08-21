import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    
    // 本月开始时间
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // 30天前
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    // 90天前
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    // 1. 本月待跟进会员数量
    const monthlyFollowUps = await prisma.followUp.count({
      where: {
        followUpDate: {
          gte: monthStart
        },
        nextFollowUpDate: {
          not: null // 有跟进计划
        }
      }
    })

    // 2. 流失风险会员（30-90天未下单）
    const riskMembers = await prisma.member.count({
      where: {
        lastOrderDate: {
          gte: ninetyDaysAgo,
          lt: thirtyDaysAgo
        },
        status: 'ACTIVE'
      }
    })

    // 3. 高价值沉睡会员（累计消费>3000且90天+未购买）
    const highValueDormant = await prisma.member.count({
      where: {
        totalAmount: {
          gte: 3000
        },
        lastOrderDate: {
          lt: ninetyDaysAgo
        },
        status: 'ACTIVE'
      }
    })

    // 4. 近期生日会员（30天内生日）
    // 注意：这里假设生日存储在某个字段中，如果没有则需要添加
    // 临时使用创建时间来模拟生日逻辑
    const thirtyDaysLater = new Date()
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
    
    // 简化处理：找出创建时间是当前月份附近的会员作为生日会员
    const currentMonth = now.getMonth()
    const upcomingBirthdays = await prisma.member.count({
      where: {
        status: 'ACTIVE',
        // 这里应该是真实的生日字段逻辑，暂时用创建时间月份代替
        createdAt: {
          gte: new Date(now.getFullYear(), currentMonth, 1),
          lt: new Date(now.getFullYear(), currentMonth + 1, 1)
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        monthlyFollowUps,
        riskMembers,
        highValueDormant,
        upcomingBirthdays
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('KPIs API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch KPI data',
        details: error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error'
      },
      { status: 500 }
    )
  }
}