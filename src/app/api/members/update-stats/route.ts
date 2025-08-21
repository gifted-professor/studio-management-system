import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateActivityLevel } from '@/lib/activity'

// 更新所有会员的统计信息
export async function POST(request: NextRequest) {
  try {
    console.log('开始更新会员统计信息...')
    
    const members = await prisma.member.findMany()
    let updatedCount = 0
    
    for (const member of members) {
      // 获取订单统计 - 包含所有订单（包括取消的）
      const stats = await prisma.order.aggregate({
        where: { memberId: member.id },
        _count: { id: true },
        _sum: { amount: true }
      })

      // 获取最后一个有付款日期的订单
      const lastOrder = await prisma.order.findFirst({
        where: { 
          memberId: member.id,
          paymentDate: { not: null }
        },
        orderBy: { paymentDate: 'desc' },
        select: { paymentDate: true }
      })

      // 计算退货率 - 取消的订单算100%退货
      const totalOrders = stats._count.id
      let returnedOrders = 0
      
      if (totalOrders > 0) {
        const cancelledCount = await prisma.order.count({
          where: { 
            memberId: member.id,
            status: 'CANCELLED' 
          }
        })
        
        const refundedCount = await prisma.order.count({
          where: { 
            memberId: member.id,
            refundAmount: { not: null }
          }
        })
        
        returnedOrders = cancelledCount + refundedCount
      }
      
      const returnRate = totalOrders > 0 ? (returnedOrders / totalOrders) * 100 : 0

      // 计算活跃度 - 需要获取最近1个月的订单数
      let totalOrdersInLastMonth = 0
      if (lastOrder?.paymentDate) {
        const oneMonthAgo = new Date()
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)
        
        totalOrdersInLastMonth = await prisma.order.count({
          where: {
            memberId: member.id,
            paymentDate: {
              gte: oneMonthAgo,
              not: null
            }
          }
        })
      }

      const activityLevel = calculateActivityLevel(
        lastOrder?.paymentDate || null,
        totalOrdersInLastMonth
      )

      // 更新会员信息
      await prisma.member.update({
        where: { id: member.id },
        data: {
          totalOrders: stats._count.id,
          totalAmount: stats._sum.amount || 0,
          lastOrderDate: lastOrder?.paymentDate,
          returnRate: returnRate,
          activityLevel: activityLevel
        }
      })
      
      updatedCount++
    }

    console.log(`更新完成，共更新 ${updatedCount} 个会员的统计信息`)

    return NextResponse.json({
      success: true,
      message: `成功更新 ${updatedCount} 个会员的统计信息`,
      updatedCount
    })

  } catch (error) {
    console.error('更新会员统计信息失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '更新统计信息失败：' + (error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : '未知错误')
      },
      { status: 500 }
    )
  }
}