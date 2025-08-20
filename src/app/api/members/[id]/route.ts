import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取单个会员详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { paymentDate: sortOrder as 'asc' | 'desc' },
        },
        _count: {
          select: { orders: true }
        }
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: '会员不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error('获取会员详情失败:', error)
    return NextResponse.json(
      { error: '获取会员详情失败' },
      { status: 500 }
    )
  }
}

// 更新会员信息
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    const { name, phone, address, status } = body

    const member = await prisma.member.update({
      where: { id },
      data: {
        name,
        phone,
        address,
        status,
      },
    })

    return NextResponse.json(member)
  } catch (error) {
    console.error('更新会员信息失败:', error)
    return NextResponse.json(
      { error: '更新会员信息失败' },
      { status: 500 }
    )
  }
}

// 删除会员
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    await prisma.member.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除会员失败:', error)
    return NextResponse.json(
      { error: '删除会员失败' },
      { status: 500 }
    )
  }
}