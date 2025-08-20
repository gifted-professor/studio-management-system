import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取所有订单
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    let where: any = {}
    
    if (search) {
      where.OR = [
        { member: { name: { contains: search } } },
        { orderNo: { contains: search } },
        { productName: { contains: search } },
      ]
    }

    if (status) {
      where.status = status
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          member: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('获取订单列表失败:', error)
    return NextResponse.json(
      { error: '获取订单列表失败' },
      { status: 500 }
    )
  }
}

// 创建新订单
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      memberId,
      orderNo,
      paymentDate,
      platform,
      responsiblePerson,
      productName,
      productCode,
      manufacturer,
      amount,
      costPrice,
      size,
      color,
      customerInfo,
      shippingAddress,
      courierCompany,
      remarks,
    } = body

    if (!memberId) {
      return NextResponse.json(
        { error: '会员ID不能为空' },
        { status: 400 }
      )
    }

    // 计算利润和利润率
    const profit = amount && costPrice ? amount - costPrice : null
    const profitRate = profit && amount ? (profit / amount) * 100 : null

    const order = await prisma.order.create({
      data: {
        memberId,
        orderNo,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        platform,
        responsiblePerson,
        productName,
        productCode,
        manufacturer,
        amount,
        costPrice,
        profit,
        profitRate,
        size,
        color,
        customerInfo,
        shippingAddress,
        courierCompany,
        remarks,
      },
      include: {
        member: true,
      },
    })

    // 更新会员统计
    await updateMemberStats(memberId)

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('创建订单失败:', error)
    return NextResponse.json(
      { error: '创建订单失败' },
      { status: 500 }
    )
  }
}

// 更新会员统计信息的辅助函数
async function updateMemberStats(memberId: number) {
  const stats = await prisma.order.aggregate({
    where: { memberId },
    _count: { id: true },
    _sum: { amount: true },
  })

  const lastOrder = await prisma.order.findFirst({
    where: { memberId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  })

  await prisma.member.update({
    where: { id: memberId },
    data: {
      totalOrders: stats._count.id,
      totalAmount: stats._sum.amount || 0,
      lastOrderDate: lastOrder?.createdAt,
    },
  })
}