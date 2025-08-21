import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 获取最近90天的热销商品数据（扩大范围以获取更多数据）
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    // 1. 按商品名称分组，统计销量和订单数
    const hotProductsRaw = await prisma.order.groupBy({
      by: ['productName'],
      where: {
        productName: {
          not: null
        },
        paymentDate: {
          not: null
        }
      },
      _count: {
        id: true
      },
      _sum: {
        amount: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5 // 取前5个热销商品
    })

    // 2. 为每个热销商品找到潜在客户
    const hotProductsWithCustomers = await Promise.all(
      hotProductsRaw.map(async (product) => {
        if (!product.productName) return null

        // 获取购买过该商品的客户信息
        const existingCustomers = await prisma.order.findMany({
          where: {
            productName: product.productName,
            paymentDate: {
              not: null
            }
          },
          select: {
            memberId: true,
            member: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        })

        const existingCustomerIds = existingCustomers.map(order => order.memberId)

        // 查找潜在客户：
        // 1. 没有购买过该商品的客户
        // 2. 但购买过相似价位商品的客户（±30%价格范围）
        // 3. 或购买过同品牌的客户
        const avgAmount = product._sum.amount ? product._sum.amount / product._count.id : 0
        const priceRangeMin = avgAmount * 0.7
        const priceRangeMax = avgAmount * 1.3

        // 提取品牌名（假设商品名格式为"品牌 商品名"）
        const brandName = product.productName.split(' ')[0]

        const potentialCustomers = await prisma.member.findMany({
          where: {
            id: {
              notIn: existingCustomerIds
            },
            lastOrderDate: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90天内有订单
            },
            orders: {
              some: {
                OR: [
                  // 购买过相似价位商品
                  {
                    amount: {
                      gte: priceRangeMin,
                      lte: priceRangeMax
                    }
                  },
                  // 购买过同品牌商品
                  {
                    productName: {
                      startsWith: brandName
                    }
                  }
                ]
              }
            }
          },
          select: {
            id: true,
            name: true,
            phone: true,
            totalAmount: true,
            lastOrderDate: true,
            orders: {
              select: {
                amount: true,
                productName: true
              },
              orderBy: {
                paymentDate: 'desc'
              },
              take: 1
            }
          },
          orderBy: {
            totalAmount: 'desc'
          },
          take: 3 // 每个商品推荐3个潜在客户
        })

        // 分析相似性原因
        const customersWithSimilarity = potentialCustomers.map(customer => {
          let similarity = '购买过同价位商品'
          
          // 检查是否购买过同品牌
          const hasSameBrand = customer.orders.some(order => 
            order.productName?.startsWith(brandName)
          )
          
          if (hasSameBrand) {
            similarity = `购买过${brandName}品牌商品`
          }

          return {
            memberId: customer.id,
            memberName: customer.name,
            memberPhone: customer.phone || '未填写',
            similarity,
            lastOrderAmount: customer.orders[0]?.amount || 0,
            totalAmount: customer.totalAmount
          }
        })

        return {
          productName: product.productName,
          salesCount: product._count.id,
          totalAmount: product._sum.amount || 0,
          avgAmount: Math.round(avgAmount),
          potentialCustomers: customersWithSimilarity
        }
      })
    )

    // 过滤掉null值
    const validHotProducts = hotProductsWithCustomers.filter(Boolean)

    return NextResponse.json({
      success: true,
      data: validHotProducts,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Hot products API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch hot products data',
        details: error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error'
      },
      { status: 500 }
    )
  }
}