import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('开始数据库诊断...')
    
    // 1. 测试数据库连接
    console.log('测试数据库连接...')
    await prisma.$connect()
    console.log('✅ 数据库连接成功')

    // 2. 执行原始SQL查询检查表
    console.log('检查表是否存在...')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `
    console.log('📋 可用表:', tables)

    // 3. 检查members表结构
    console.log('检查members表结构...')
    const membersColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'members' 
      ORDER BY ordinal_position;
    `
    console.log('🏗️ Members表结构:', membersColumns)

    // 4. 检查members表数据
    console.log('检查members表数据...')
    const memberCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM members;`
    console.log('📊 Members表记录数:', memberCount)

    // 5. 获取前几条记录
    console.log('获取示例数据...')
    const sampleMembers = await prisma.$queryRaw`SELECT * FROM members LIMIT 3;`
    console.log('👥 示例会员数据:', sampleMembers)

    // 6. 尝试使用Prisma查询
    console.log('尝试Prisma查询...')
    const prismaCount = await prisma.member.count()
    console.log('✅ Prisma查询成功，记录数:', prismaCount)

    const prismaSample = await prisma.member.findMany({
      take: 2,
      select: {
        id: true,
        name: true,
        phone: true,
        status: true
      }
    })
    console.log('✅ Prisma示例数据:', prismaSample)

    return NextResponse.json({
      success: true,
      diagnostic: {
        connection: '成功',
        tables: tables,
        membersStructure: membersColumns,
        rawMemberCount: memberCount,
        sampleRawData: sampleMembers,
        prismaMemberCount: prismaCount,
        prismaSampleData: prismaSample,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ 数据库诊断失败:', error)
    
    // 详细错误信息
    const errorDetails = {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }

    console.error('错误详情:', errorDetails)

    return NextResponse.json({
      success: false,
      error: '数据库诊断失败',
      details: errorDetails
    }, { status: 500 })
    
  } finally {
    await prisma.$disconnect()
  }
}