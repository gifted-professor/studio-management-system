import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    // 1. 高价值沉睡客户（累计消费>3000且45天+未下单）
    const dormantHighValue = await prisma.member.findMany({
      where: {
        totalAmount: {
          gte: 3000
        },
        lastOrderDate: {
          lt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
        },
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        phone: true,
        totalAmount: true,
        lastOrderDate: true,
        orders: {
          select: {
            productName: true,
            manufacturer: true
          },
          orderBy: {
            paymentDate: 'desc'
          },
          take: 3
        }
      },
      orderBy: {
        totalAmount: 'desc'
      },
      take: 5
    })

    // 2. 交叉销售机会（最近购买单一类别商品的客户）
    const crossSellOpportunities = await prisma.member.findMany({
      where: {
        lastOrderDate: {
          gte: thirtyDaysAgo
        },
        totalOrders: {
          gte: 2
        }
      },
      select: {
        id: true,
        name: true,
        phone: true,
        totalAmount: true,
        orders: {
          where: {
            paymentDate: {
              gte: thirtyDaysAgo
            }
          },
          select: {
            productName: true,
            manufacturer: true,
            amount: true
          },
          orderBy: {
            paymentDate: 'desc'
          },
          take: 5
        }
      },
      take: 10
    })

    // 3. VIP升级机会（距离下一级别差距较小的客户）
    const vipUpgradeOpportunities = await prisma.member.findMany({
      where: {
        totalAmount: {
          gte: 3000,
          lt: 5000 // 假设5000是VIP门槛
        },
        status: 'ACTIVE',
        lastOrderDate: {
          gte: ninetyDaysAgo
        }
      },
      select: {
        id: true,
        name: true,
        phone: true,
        totalAmount: true,
        lastOrderDate: true
      },
      orderBy: {
        totalAmount: 'desc'
      },
      take: 3
    })

    // 格式化数据
    const opportunities = [
      // 高价值沉睡客户
      ...dormantHighValue.map(member => {
        const daysSinceLastOrder = member.lastOrderDate 
          ? Math.floor((now.getTime() - member.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
          : 999
        
        const favoriteProducts = member.orders.map(o => o.productName).filter(Boolean).slice(0, 2)
        const favoriteText = favoriteProducts.length > 0 
          ? `，偏爱${favoriteProducts.join('、')}` 
          : ''

        return {
          id: `dormant_${member.id}`,
          type: 'dormant_high_value' as const,
          memberId: member.id,
          memberName: member.name,
          memberPhone: member.phone || '未填写',
          message: `高价值客户，累计消费¥${Math.round(member.totalAmount)}，已超过${daysSinceLastOrder}天未下单${favoriteText}，建议主动关怀`,
          urgency: daysSinceLastOrder > 60 ? 'high' as const : 'medium' as const,
          actionButton: '立即联系',
          data: {
            totalAmount: member.totalAmount,
            daysSinceLastOrder,
            favoriteProducts
          }
        }
      }),

      // 交叉销售机会
      ...crossSellOpportunities.slice(0, 3).map(member => {
        const brands = Array.from(new Set(member.orders.map(o => o.manufacturer).filter(Boolean)))
        const avgAmount = member.orders.reduce((sum, o) => sum + (o.amount || 0), 0) / member.orders.length

        return {
          id: `cross_sell_${member.id}`,
          type: 'cross_sell' as const,
          memberId: member.id,
          memberName: member.name,
          memberPhone: member.phone || '未填写',
          message: `近期购买了${brands[0] || '品牌'}商品，平均单价¥${Math.round(avgAmount)}，可推荐同系列其他产品`,
          urgency: 'medium' as const,
          actionButton: '推荐搭配',
          data: {
            recentBrands: brands,
            avgAmount
          }
        }
      }),

      // VIP升级机会
      ...vipUpgradeOpportunities.map(member => {
        const remaining = 5000 - member.totalAmount

        return {
          id: `vip_upgrade_${member.id}`,
          type: 'vip_upgrade' as const,
          memberId: member.id,
          memberName: member.name,
          memberPhone: member.phone || '未填写',
          message: `累计消费¥${Math.round(member.totalAmount)}，距离VIP还差¥${Math.round(remaining)}，可提醒升级享受折扣`,
          urgency: remaining < 500 ? 'high' as const : 'medium' as const,
          actionButton: '升级提醒',
          data: {
            currentAmount: member.totalAmount,
            remaining
          }
        }
      })
    ]

    // 按优先级排序
    const sortedOpportunities = opportunities.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 }
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency]
    })

    return NextResponse.json({
      success: true,
      data: sortedOpportunities.slice(0, 10), // 限制返回数量
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Smart opportunities API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch smart opportunities',
        details: error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error'
      },
      { status: 500 }
    )
  }
}