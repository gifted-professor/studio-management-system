const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

async function importExcelData() {
  try {
    // 读取Excel文件
    const excelPath = '/Volumes/GPFS/服装/账单/7 月账单.xlsx';
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`读取到 ${data.length} 条记录`);

    let importedMembers = 0;
    let importedOrders = 0;

    for (const row of data) {
      try {
        // 检查必要字段
        if (!row['姓名']) continue;

        // 查找或创建会员
        let member = await prisma.member.findFirst({
          where: {
            OR: [
              { name: row['姓名'] },
              row['手机号'] ? { phone: row['手机号'] } : {}
            ].filter(Boolean)
          }
        });

        if (!member) {
          member = await prisma.member.create({
            data: {
              name: row['姓名'],
              phone: row['手机号'] || null,
              address: row['地址'] || null,
              status: 'ACTIVE'
            }
          });
          importedMembers++;
        }

        // 创建订单
        const orderData = {
          memberId: member.id,
          orderNo: row['单号'] || null,
          paymentDate: row['顾客付款日期'] ? new Date(row['顾客付款日期']) : null,
          platform: row['出售平台'] || null,
          responsiblePerson: row['负责人'] || null,
          productName: row['商品名称'] || null,
          productCode: row['货品名'] || null,
          manufacturer: row['厂家'] || null,
          amount: parseFloat(row['收款额']) || 0,
          costPrice: parseFloat(row['成本价']) || 0,
          size: row['尺码'] || null,
          color: row['颜色'] || null,
          customerInfo: row['客户信息'] || null,
          shippingAddress: row['地址'] || null,
          courierCompany: row['快递公司'] || null,
          remarks: row['备注'] || null,
        };

        // 计算利润
        if (orderData.amount && orderData.costPrice) {
          orderData.profit = orderData.amount - orderData.costPrice;
          orderData.profitRate = (orderData.profit / orderData.amount) * 100;
        }

        // 检查订单是否已存在
        const existingOrder = await prisma.order.findFirst({
          where: {
            memberId: member.id,
            orderNo: orderData.orderNo,
            paymentDate: orderData.paymentDate
          }
        });

        if (!existingOrder) {
          await prisma.order.create({
            data: orderData
          });
          importedOrders++;
        }

      } catch (rowError) {
        console.error(`处理行数据失败:`, rowError);
        continue;
      }
    }

    // 更新会员统计
    console.log('更新会员统计信息...');
    const members = await prisma.member.findMany();
    
    for (const member of members) {
      const stats = await prisma.order.aggregate({
        where: { memberId: member.id },
        _count: { id: true },
        _sum: { amount: true }
      });

      const lastOrder = await prisma.order.findFirst({
        where: { memberId: member.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      });

      await prisma.member.update({
        where: { id: member.id },
        data: {
          totalOrders: stats._count.id,
          totalAmount: stats._sum.amount || 0,
          lastOrderDate: lastOrder?.createdAt
        }
      });
    }

    console.log(`导入完成！`);
    console.log(`新增会员: ${importedMembers} 个`);
    console.log(`新增订单: ${importedOrders} 个`);

  } catch (error) {
    console.error('导入失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importExcelData();