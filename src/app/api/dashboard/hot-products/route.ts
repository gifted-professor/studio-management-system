import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 获取最近60天的热销商品数据
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    // 1. 按商品编码分组，统计销量和订单数
    const hotProductsRaw = await prisma.order.groupBy({
      by: ['productCode'],
      where: {
        productCode: {
          not: null
        },
        paymentDate: {
          gte: sixtyDaysAgo
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
      take: 10 // 取前10个热销商品
    })

    // 2. 为每个热销商品编码获取详细信息
    const hotProducts = await Promise.all(
      hotProductsRaw
        .filter(product => product.productCode) // 过滤掉null值
        .map(async (product) => {
          const avgAmount = product._sum.amount ? product._sum.amount / product._count.id : 0
          
          // 获取该商品编码下的具体商品信息（取最新的一个作为代表）
          const productDetail = await prisma.order.findFirst({
            where: {
              productCode: product.productCode,
              productName: {
                not: null
              }
            },
            select: {
              productName: true,
              productCode: true,
              manufacturer: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          })
          
          return {
            productCode: product.productCode,
            productName: productDetail?.productName || `商品编码: ${product.productCode}`,
            manufacturer: productDetail?.manufacturer || '未知品牌',
            salesCount: product._count.id,
            totalAmount: product._sum.amount || 0,
            avgAmount: Math.round(avgAmount)
          }
        })
    )

    return NextResponse.json({
      success: true,
      data: hotProducts,
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