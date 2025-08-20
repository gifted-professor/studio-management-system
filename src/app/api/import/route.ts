import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, message: '请选择要上传的文件' },
        { status: 400 }
      )
    }

    // 验证文件类型
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { success: false, message: '请上传Excel文件 (.xlsx 或 .xls)' },
        { status: 400 }
      )
    }

    // 读取文件内容
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    let newMembers = 0
    let newOrders = 0
    let duplicateMembers = 0
    let duplicateOrders = 0
    const totalProcessed = data.length

    console.log(`开始处理 ${totalProcessed} 条记录`)

    for (let index = 0; index < data.length; index++) {
      const row = data[index]
      try {
        // 检查必要字段
        const rowData = row as any
        if (!rowData['姓名']) {
          console.log(`跳过第 ${index + 1} 行: 缺少姓名`)
          continue
        }
        
        if (index < 5) {
          console.log(`处理第 ${index + 1} 行: ${rowData['姓名']} - 单号: ${rowData['单号']} - 商品: ${rowData['商品名称']}`)
        }

        // 查找或创建会员
        let member = await prisma.member.findFirst({
          where: {
            OR: [
              { name: rowData['姓名'] },
              rowData['手机号'] ? { phone: rowData['手机号'] } : {}
            ].filter(Boolean)
          }
        })

        if (!member) {
          // 创建新会员
          member = await prisma.member.create({
            data: {
              name: rowData['姓名'],
              phone: rowData['手机号'] || null,
              address: rowData['地址'] || null,
              status: 'ACTIVE'
            }
          })
          newMembers++
          console.log(`创建新会员: ${member.name}`)
        } else {
          duplicateMembers++
          // 更新会员信息（如果有新信息）
          await prisma.member.update({
            where: { id: member.id },
            data: {
              phone: rowData['手机号'] || member.phone,
              address: rowData['地址'] || member.address,
            }
          })
        }

        // === 开始处理订单 ===
        console.log(`[订单处理] 开始处理订单 - 会员: ${rowData['姓名']}, 行: ${index + 1}`)
        
        // 检查订单是否已存在
        const orderNo = rowData['单号'] || null
        // 处理付款日期 - Excel格式转换
        let paymentDate = null
        if (rowData['顾客付款日期']) {
          if (typeof rowData['顾客付款日期'] === 'number') {
            // Excel日期从1900年1月1日开始计算
            paymentDate = new Date((rowData['顾客付款日期'] - 25569) * 86400 * 1000)
          } else {
            paymentDate = new Date(rowData['顾客付款日期'])
          }
        }
        const productName = rowData['商品名称'] || null
        const memberName = rowData['姓名']
        const memberPhone = rowData['手机号'] || null

        // 简化重复检查逻辑，只检查订单号和会员姓名
        let existingOrder = null
        console.log(`[订单检查] 订单号: ${orderNo}, 会员: ${memberName}`)
        
        if (orderNo && memberName) {
          existingOrder = await prisma.order.findFirst({
            where: {
              AND: [
                { orderNo: orderNo },
                { 
                  member: {
                    name: memberName
                  }
                }
              ]
            }
          })
          console.log(`[订单检查] 重复检查结果: ${existingOrder ? '找到重复' : '未找到重复'}`)
        } else {
          console.log(`[订单检查] 跳过检查 - 订单号或会员名为空`)
        }

        // 简化订单创建逻辑，只要有订单信息就创建
        const amount = parseFloat(rowData['收款额']) || 0
        if (orderNo || productName || amount > 0) {
          console.log(`检测到订单信息，创建订单 - 会员: ${memberName}, 订单号: ${orderNo}, 商品: ${productName}`)
          
          try {
            const costPrice = parseFloat(rowData['成本价']) || 0
            const profit = amount && costPrice ? amount - costPrice : null
            const profitRate = profit && amount ? (profit / amount) * 100 : null

          // 处理退款日期
          const refundDateValue = rowData['退款日'];
          let refundDate = null;
          if (refundDateValue) {
            // Excel日期可能是数字格式，需要转换
            if (typeof refundDateValue === 'number') {
              // Excel日期从1900年1月1日开始计算
              refundDate = new Date((refundDateValue - 25569) * 86400 * 1000);
            } else {
              refundDate = new Date(refundDateValue);
            }
          }

          await prisma.order.create({
            data: {
              memberId: member.id,
              orderNo,
              paymentDate,
              platform: rowData['出售平台'] || null,
              responsiblePerson: rowData['负责人'] || null,
              productName: rowData['商品名称'] || null,
              productCode: rowData['货品名'] || null,
              manufacturer: rowData['厂家'] || null,
              amount,
              costPrice,
              profit,
              profitRate,
              size: rowData['尺码'] || null,
              color: rowData['颜色'] || null,
              customerInfo: rowData['客户信息'] || null,
              shippingAddress: rowData['地址'] || null,
              courierCompany: rowData['快递公司'] || null,
              remarks: rowData['备注'] || null,
              refundResponsible: rowData['退款负责人'] || null,
              refundDate: refundDate,
              refundAmount: parseFloat(rowData['退款金额']) || null,
              refundType: rowData['退款类型'] || null,
              refundReason: rowData['退款原因'] || null,
              returnTrackingNo: rowData['退货单号'] || null,
              returnAddress: rowData['退货地址'] || null,
              status: 'PENDING'
            }
          })
            newOrders++
            console.log(`成功创建订单 ${newOrders}: ${orderNo}`)
            
          } catch (orderError) {
            console.error(`创建订单失败 (${memberName}):`, orderError)
          }
        } else {
          console.log(`跳过：没有订单信息 - 订单号: ${orderNo}, 商品: ${productName}, 金额: ${amount}`)
        }

      } catch (rowError) {
        console.error(`处理行数据失败:`, rowError)
        continue
      }
    }

    // 更新会员统计信息
    console.log('更新会员统计信息...')
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

      // 计算退货率 - 退货类型不为空的订单数/总订单数
      const returnedOrders = await prisma.order.count({
        where: { 
          memberId: member.id,
          refundType: { not: null }
        }
      })

      const returnRate = stats._count.id > 0 ? (returnedOrders / stats._count.id) * 100 : 0

      await prisma.member.update({
        where: { id: member.id },
        data: {
          totalOrders: stats._count.id,
          totalAmount: stats._sum.amount || 0,
          lastOrderDate: lastOrder?.paymentDate,
          returnRate: returnRate
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `导入完成！新增 ${newMembers} 个会员，${newOrders} 个订单。跳过 ${duplicateMembers} 个重复会员，${duplicateOrders} 个重复订单。`,
      data: {
        newMembers,
        newOrders,
        duplicateMembers,
        duplicateOrders,
        totalProcessed
      }
    })

  } catch (error) {
    console.error('导入失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '导入失败：' + (error instanceof Error ? error.message : '未知错误')
      },
      { status: 500 }
    )
  }
}