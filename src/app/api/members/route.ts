import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取所有会员
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'totalOrders'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // 构建排序条件
    let orderBy: any = [
      { totalOrders: 'desc' },
      { createdAt: 'desc' }
    ] // 默认排序：按订单数量降序，次级按创建时间降序
    
    if (sortBy === 'lastOrderDate') {
      // 处理最后下单时间排序
      orderBy = [
        { lastOrderDate: sortOrder },
        { createdAt: 'desc' } // 次级排序
      ]
    } else if (sortBy === 'totalOrders') {
      orderBy = [
        { totalOrders: sortOrder },
        { createdAt: 'desc' } // 次级排序
      ]
    } else if (sortBy === 'totalAmount') {
      orderBy = [
        { totalAmount: sortOrder },
        { createdAt: 'desc' } // 次级排序
      ]
    }

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {}

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { orders: true }
          }
        },
        orderBy,
      }),
      prisma.member.count({ where }),
    ])

    return NextResponse.json({
      members,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('获取会员列表失败:', error)
    return NextResponse.json(
      { error: '获取会员列表失败' },
      { status: 500 }
    )
  }
}

// 创建新会员
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, address, status } = body

    if (!name) {
      return NextResponse.json(
        { error: '会员姓名不能为空' },
        { status: 400 }
      )
    }

    // 检查是否已存在同名或同手机号的会员
    if (phone) {
      const existingMember = await prisma.member.findFirst({
        where: {
          OR: [
            { name: name },
            { phone: phone }
          ]
        }
      })

      if (existingMember) {
        return NextResponse.json(
          { error: '已存在同名或同手机号的会员' },
          { status: 400 }
        )
      }
    } else {
      const existingMember = await prisma.member.findFirst({
        where: { name: name }
      })

      if (existingMember) {
        return NextResponse.json(
          { error: '已存在同名的会员' },
          { status: 400 }
        )
      }
    }

    const member = await prisma.member.create({
      data: {
        name,
        phone,
        address,
        status: status || 'ACTIVE',
        totalOrders: 0,
        totalAmount: 0
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('创建会员失败:', error)
    return NextResponse.json(
      { error: '创建会员失败' },
      { status: 500 }
    )
  }
}