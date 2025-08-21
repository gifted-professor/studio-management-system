import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    // 读取原始Excel文件重新获取正确的付款日期
    const filePath = '/Volumes/GPFS/服装/账单/7 月账单.xlsx'
    const workbook = XLSX.read(require('fs').readFileSync(filePath))
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    let updatedOrders = 0

    console.log(`开始修复 ${data.length} 条记录的付款日期`)

    for (const row of data) {
      try {
        const rowData = row as any
        if (!rowData['姓名']) continue

        // 正确处理付款日期
        let paymentDate = null
        if (rowData['顾客付款日期']) {
          if (typeof rowData['顾客付款日期'] === 'number') {
            // Excel日期从1900年1月1日开始计算
            paymentDate = new Date((rowData['顾客付款日期'] - 25569) * 86400 * 1000)
          } else {
            paymentDate = new Date(rowData['顾客付款日期'])
          }
        }

        if (!paymentDate) continue

        // 查找对应的订单
        const orderNo = rowData['单号'] || null
        const productName = rowData['商品名称'] || null
        const memberName = rowData['姓名']
        const memberPhone = rowData['手机号'] || null

        const order = await prisma.order.findFirst({
          where: {
            AND: [
              { orderNo: orderNo },
              { productName: productName },
              { 
                member: {
                  name: memberName,
                  phone: memberPhone
                }
              }
            ]
          }
        })

        if (order) {
          // 更新订单的付款日期
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentDate: paymentDate }
          })
          updatedOrders++
        }

      } catch (rowError) {
        console.error(`处理行数据失败:`, rowError)
        continue
      }
    }

    // 重新更新会员统计信息
    console.log('重新计算会员统计信息...')
    const members = await prisma.member.findMany()
    
    for (const member of members) {
      const stats = await prisma.order.aggregate({
        where: { memberId: member.id },
        _count: { id: true },
        _sum: { amount: true }
      })

      const lastOrder = await prisma.order.findFirst({
        where: { 
          memberId: member.id,
          paymentDate: { not: null }
        },
        orderBy: { paymentDate: 'desc' },
        select: { paymentDate: true }
      })

      await prisma.member.update({
        where: { id: member.id },
        data: {
          totalOrders: stats._count.id,
          totalAmount: stats._sum.amount || 0,
          lastOrderDate: lastOrder?.paymentDate
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `成功修复 ${updatedOrders} 个订单的付款日期，并更新了所有会员统计信息`,
      updatedOrders
    })

  } catch (error) {
    console.error('修复付款日期失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '修复付款日期失败：' + (error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : '未知错误')
      },
      { status: 500 }
    )
  }
}