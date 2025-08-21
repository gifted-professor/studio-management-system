import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    // 获取今日需要跟进的任务
    const todayTasks = await prisma.followUp.findMany({
      where: {
        nextFollowUpDate: {
          gte: todayStart,
          lt: todayEnd
        }
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            totalAmount: true,
            lastOrderDate: true
          }
        },
        order: {
          select: {
            id: true,
            productName: true,
            amount: true,
            paymentDate: true
          }
        }
      },
      orderBy: {
        nextFollowUpDate: 'asc'
      },
      take: 20 // 限制显示数量
    })

    // 格式化数据
    const formattedTasks = todayTasks.map(task => ({
      id: task.id,
      memberId: task.member.id,
      memberName: task.member.name,
      memberPhone: task.member.phone || '未填写',
      followUpType: task.followUpType,
      content: task.content || '常规跟进',
      lastOrderDate: task.member.lastOrderDate?.toISOString().split('T')[0],
      totalAmount: Math.round(task.member.totalAmount),
      orderInfo: task.order ? {
        productName: task.order.productName,
        amount: task.order.amount,
        paymentDate: task.order.paymentDate?.toISOString().split('T')[0]
      } : null,
      scheduledTime: task.nextFollowUpDate?.toISOString(),
      operator: task.operator
    }))

    return NextResponse.json({
      success: true,
      data: formattedTasks,
      count: formattedTasks.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Today tasks API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch today tasks',
        details: error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error'
      },
      { status: 500 }
    )
  }
}