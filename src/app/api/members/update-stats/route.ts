import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 更新所有会员的统计信息
export async function POST(request: NextRequest) {
  try {
    console.log('开始更新会员统计信息...')
    
    const members = await prisma.member.findMany()
    let updatedCount = 0
    
    for (const member of members) {
      // 获取订单统计
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

      // 更新会员信息
      await prisma.member.update({
        where: { id: member.id },
        data: {
          totalOrders: stats._count.id,
          totalAmount: stats._sum.amount || 0,
          lastOrderDate: lastOrder?.paymentDate
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
        message: '更新统计信息失败：' + (error instanceof Error ? error.message : '未知错误')
      },
      { status: 500 }
    )
  }
}