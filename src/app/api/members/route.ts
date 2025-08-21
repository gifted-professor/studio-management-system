import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { memoryCache } from '@/lib/cache'

// 获取所有会员
export async function GET(request: NextRequest) {
  try {
    // 添加调试信息
    console.log('环境变量检查:', {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_DATABASE_URL,
      dbUrl: process.env.DATABASE_URL?.substring(0, 50) + '...'
    })
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'totalOrders'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const activityLevel = searchParams.get('activityLevel') || ''
    const daysSinceOrder = searchParams.get('daysSinceOrder') || ''
    const platform = searchParams.get('platform') || ''
    const filter = searchParams.get('filter') || '' // 特殊筛选器

    // 生成缓存键
    const cacheKey = `members:${page}:${limit}:${search}:${sortBy}:${sortOrder}:${activityLevel}:${daysSinceOrder}:${platform}:${filter}`
    
    // 尝试从缓存获取数据（仅当没有搜索时缓存）
    if (!search) {
      const cachedData = memoryCache.get(cacheKey)
      if (cachedData) {
        console.log(`从缓存返回会员数据，缓存键: ${cacheKey}`)
        return NextResponse.json(cachedData)
      }
    }

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

    // 构建查询条件
    const where: any = {
      totalOrders: { gt: 0 } // 只显示有订单的会员
    }
    
    // 构建AND条件数组
    const andConditions: any[] = []
    
    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } },
        ]
      })
    }
    
    if (activityLevel) {
      // 根据新的时间范围定义来筛选
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      if (activityLevel === 'ACTIVE') {
        // 活跃：50天内有下单
        const fiftyDaysAgo = new Date(today)
        fiftyDaysAgo.setDate(fiftyDaysAgo.getDate() - 50)
        andConditions.push({
          lastOrderDate: {
            gte: fiftyDaysAgo,
            not: null
          }
        })
      } else if (activityLevel === 'SLIGHTLY_INACTIVE') {
        // 轻度流失：大于50天小于90天
        const fiftyDaysAgo = new Date(today)
        const ninetyDaysAgo = new Date(today)
        fiftyDaysAgo.setDate(fiftyDaysAgo.getDate() - 50)
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        andConditions.push({
          lastOrderDate: {
            lt: fiftyDaysAgo,
            gte: ninetyDaysAgo,
            not: null
          }
        })
      } else if (activityLevel === 'HEAVILY_INACTIVE') {
        // 重度流失：大于90天
        const ninetyDaysAgo = new Date(today)
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        andConditions.push({
          OR: [
            {
              lastOrderDate: {
                lt: ninetyDaysAgo,
                not: null
              }
            },
            {
              lastOrderDate: null
            }
          ]
        })
      }
    }
    
    // 处理基于下单时间的筛选
    if (daysSinceOrder) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      if (daysSinceOrder === 'active') {
        // 活跃用户：最近7天内下单
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        andConditions.push({
          lastOrderDate: {
            gte: sevenDaysAgo,
            not: null
          }
        })
      } else if (daysSinceOrder === 'recent') {
        // 近期客户：8-30天前下单
        const thirtyDaysAgo = new Date(today)
        const eightDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        eightDaysAgo.setDate(eightDaysAgo.getDate() - 7)
        andConditions.push({
          lastOrderDate: {
            gte: thirtyDaysAgo,
            lt: eightDaysAgo,
            not: null
          }
        })
      } else if (daysSinceOrder === 'promotion') {
        // 促单目标：31-90天前下单
        const ninetyDaysAgo = new Date(today)
        const thirtyOneDaysAgo = new Date(today)
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 30)
        andConditions.push({
          lastOrderDate: {
            gte: ninetyDaysAgo,
            lt: thirtyOneDaysAgo,
            not: null
          }
        })
      } else if (daysSinceOrder === 'care') {
        // 重点关怀：90天前下单 或 从未下单
        const ninetyDaysAgo = new Date(today)
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        andConditions.push({
          OR: [
            {
              lastOrderDate: {
                lt: ninetyDaysAgo,
                not: null
              }
            },
            {
              lastOrderDate: null
            }
          ]
        })
      }
    }
    
    // 处理按出售平台的筛选
    if (platform) {
      andConditions.push({
        orders: {
          some: {
            platform: platform
          }
        }
      })
    }
    
    // 处理特殊筛选器
    if (filter) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      if (filter === 'risk') {
        // 流失风险会员：30-90天未复购
        const thirtyDaysAgo = new Date(today)
        const ninetyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        andConditions.push({
          lastOrderDate: {
            gte: ninetyDaysAgo,
            lt: thirtyDaysAgo,
            not: null
          }
        })
      } else if (filter === 'high_value_dormant') {
        // 高价值沉睡会员：累计消费>=3000且90天以上未购买(必须有购买记录)
        const ninetyDaysAgo = new Date(today)
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        andConditions.push({
          totalAmount: {
            gte: 3000
          },
          lastOrderDate: {
            lt: ninetyDaysAgo,
            not: null
          }
        })
      } else if (filter === 'birthday') {
        // 近期生日会员（30天内生日）
        // 注意：这里假设生日存储在某个字段中，实际需要根据数据库结构调整
        // 暂时使用创建时间月份来模拟
        const currentMonth = now.getMonth()
        const nextMonth = (currentMonth + 1) % 12
        andConditions.push({
          // 这里需要根据实际的生日字段来调整
          // 暂时用创建时间月份代替
          OR: [
            {
              createdAt: {
                gte: new Date(now.getFullYear(), currentMonth, 1),
                lt: new Date(now.getFullYear(), currentMonth + 1, 1)
              }
            },
            {
              createdAt: {
                gte: new Date(now.getFullYear(), nextMonth, 1),
                lt: new Date(now.getFullYear(), nextMonth + 1, 1)
              }
            }
          ]
        })
      }
    }
    
    // 如果有AND条件，将它们合并到where子句中
    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    const [members, total, platforms] = await Promise.all([
      prisma.member.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
          status: true,
          activityLevel: true,
          totalOrders: true,
          totalAmount: true,
          lastOrderDate: true,
          returnRate: true,
          createdAt: true,
        },
        orderBy,
      }),
      prisma.member.count({ where }),
      // 获取平台及其订单数量，只显示订单量≥10的平台
      prisma.order.groupBy({
        by: ['platform'],
        where: {
          platform: { 
            not: null,
            notIn: ['五店', '三店', '代发', 'pdd', '样品'] // 过滤掉指定平台
          }
        },
        _count: {
          platform: true
        },
        having: {
          platform: {
            _count: {
              gte: 10
            }
          }
        }
      })
    ])

    // 提取符合条件的平台名称并排序
    const availablePlatforms = platforms
      .map(item => item.platform)
      .filter(Boolean)
      .sort()

    const response = {
      members,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      platforms: availablePlatforms,
    }

    // 缓存响应数据（仅当没有搜索时缓存）
    if (!search) {
      console.log(`缓存会员数据，缓存键: ${cacheKey}，总数: ${response.pagination.total}`)
      memoryCache.set(cacheKey, response, 2 * 60 * 1000) // 缓存2分钟
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('获取会员列表失败:', error)
    return NextResponse.json(
      { 
        error: '获取会员列表失败',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        hasDbUrl: !!process.env.DATABASE_URL,
        hasDirectUrl: !!process.env.DIRECT_DATABASE_URL,
        dbUrl: process.env.DATABASE_URL?.substring(0, 70) + '...',
        errorType: error?.constructor.name
      },
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