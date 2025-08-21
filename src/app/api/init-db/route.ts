import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // 1. 首先检查数据库连接
    await prisma.$connect()
    console.log('数据库连接成功')

    // 2. 推送数据库schema（创建表）
    console.log('开始初始化数据库表结构...')
    
    // 检查是否已有数据
    const memberCount = await prisma.member.count()
    console.log(`当前会员数量: ${memberCount}`)

    if (memberCount === 0) {
      // 3. 创建一些示例数据
      console.log('创建示例数据...')
      
      const sampleMember = await prisma.member.create({
        data: {
          name: '张三',
          phone: '13800138000',
          address: '北京市朝阳区',
          status: 'ACTIVE',
          activityLevel: 'ACTIVE',
          totalOrders: 2,
          totalAmount: 1500.0,
          lastOrderDate: new Date(),
        }
      })

      await prisma.order.createMany({
        data: [
          {
            memberId: sampleMember.id,
            orderNo: 'ORD001',
            paymentDate: new Date(),
            platform: '淘宝',
            responsiblePerson: '客服A',
            productName: '测试商品A',
            productCode: 'PROD001',
            manufacturer: '测试品牌',
            amount: 800.0,
            costPrice: 600.0,
            profit: 200.0,
            profitRate: 25.0,
            status: 'COMPLETED',
            size: 'M',
            color: '红色',
            customerInfo: '张三 13800138000',
            shippingAddress: '北京市朝阳区'
          },
          {
            memberId: sampleMember.id,
            orderNo: 'ORD002',
            paymentDate: new Date(),
            platform: '京东',
            responsiblePerson: '客服B',
            productName: '测试商品B',
            productCode: 'PROD002',
            manufacturer: '测试品牌',
            amount: 700.0,
            costPrice: 500.0,
            profit: 200.0,
            profitRate: 28.6,
            status: 'COMPLETED',
            size: 'L',
            color: '蓝色',
            customerInfo: '张三 13800138000',
            shippingAddress: '北京市朝阳区'
          }
        ]
      })

      // 更新会员统计信息
      await prisma.member.update({
        where: { id: sampleMember.id },
        data: {
          totalOrders: 2,
          totalAmount: 1500.0,
          lastOrderDate: new Date()
        }
      })

      console.log('示例数据创建完成')
    }

    // 4. 验证数据
    const finalMemberCount = await prisma.member.count()
    const orderCount = await prisma.order.count()

    return NextResponse.json({
      success: true,
      message: '数据库初始化成功',
      data: {
        memberCount: finalMemberCount,
        orderCount: orderCount,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('数据库初始化失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      details: error
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}