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
          gte: todayStart.toISOString().split('T')[0],
          lt: todayEnd.toISOString().split('T')[0]
        }
      },
      select: {
        id: true,
        memberId: true,
        orderId: true,
        followUpType: true,
        content: true,
        nextFollowUpDate: true,
        operator: true
      },
      orderBy: {
        nextFollowUpDate: 'asc'
      },
      take: 20 // 限制显示数量
    })

    // 获取相关会员和订单信息
    const memberIds = Array.from(new Set(todayTasks.map(task => task.memberId).filter(Boolean)))
    const orderIds = Array.from(new Set(todayTasks.map(task => task.orderId).filter(Boolean)))
    
    const members = await prisma.member.findMany({
      where: { id: { in: memberIds } },
      select: {
        id: true,
        name: true,
        phone: true,
        totalAmount: true,
        lastOrderDate: true
      }
    })
    
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: {
        id: true,
        productName: true,
        amount: true,
        paymentDate: true
      }
    })
    
    const memberMap = new Map(members.map(m => [m.id, m]))
    const orderMap = new Map(orders.map(o => [o.id, o]))

    // 格式化数据
    const formattedTasks = todayTasks.map(task => {
      const member = memberMap.get(task.memberId!)
      const order = orderMap.get(task.orderId!)
      
      return {
        id: task.id,
        memberId: task.memberId,
        memberName: member?.name || '未知',
        memberPhone: member?.phone?.toString() || '未填写',
        followUpType: task.followUpType,
        content: task.content || '常规跟进',
        lastOrderDate: member?.lastOrderDate?.toISOString().split('T')[0],
        totalAmount: member?.totalAmount ? Number(member.totalAmount) : 0,
        orderInfo: order ? {
          productName: order.productName,
          amount: order.amount,
          paymentDate: order.paymentDate?.toISOString().split('T')[0]
        } : null,
        scheduledTime: task.nextFollowUpDate,
        operator: task.operator
      }
    })

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