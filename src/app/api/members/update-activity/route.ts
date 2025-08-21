import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateActivityLevel } from '@/lib/activity';

export async function POST() {
  try {
    console.log('开始更新会员活跃度...');
    
    // 使用更小的批次大小避免超时
    const batchSize = 50;
    let offset = 0;
    let totalUpdated = 0;
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // 设置最大处理数量以避免超时，可以根据需要调整
    const maxProcessCount = 1000;
    let processedCount = 0;

    while (processedCount < maxProcessCount) {
      // 获取一批会员
      const members = await prisma.member.findMany({
        skip: offset,
        take: batchSize,
        select: {
          id: true,
          name: true,
          activityLevel: true,
          orders: {
            where: {
              paymentDate: {
                not: null
              }
            },
            select: {
              paymentDate: true
            },
            orderBy: {
              paymentDate: 'desc'
            },
            take: 50 // 限制每个会员的订单数量
          }
        }
      });

      if (members.length === 0) break;
      
      console.log(`处理第 ${offset + 1} - ${offset + members.length} 个会员`);

      // 串行处理避免数据库压力过大
      for (const member of members) {
        try {
          const lastOrderDate = member.orders[0]?.paymentDate || null;
          
          // 计算最近一个月的订单数量
          const ordersInLastMonth = member.orders.filter(order => 
            order.paymentDate && order.paymentDate >= oneMonthAgo
          ).length;

          // 计算活跃度等级
          const newActivityLevel = calculateActivityLevel(lastOrderDate, ordersInLastMonth);

          // 如果活跃度有变化，更新数据库
          if (member.activityLevel !== newActivityLevel) {
            await prisma.member.update({
              where: { id: member.id },
              data: { activityLevel: newActivityLevel }
            });
            totalUpdated++;
          }
        } catch (error) {
          console.error(`更新会员 ${member.name} 失败:`, error);
        }
      }

      processedCount += members.length;
      offset += batchSize;
      
      console.log(`已处理 ${processedCount} 个会员，更新了 ${totalUpdated} 个`);
      
      // 添加短暂延迟避免数据库过载
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`活跃度更新完成，总共处理了 ${processedCount} 个会员，更新了 ${totalUpdated} 个`);
    
    return NextResponse.json({
      success: true,
      message: `成功处理了 ${processedCount} 个会员，更新了 ${totalUpdated} 个会员的活跃度`,
      processedCount,
      updatedCount: totalUpdated
    });

  } catch (error) {
    console.error('更新会员活跃度失败:', error);
    return NextResponse.json(
      { success: false, message: `更新会员活跃度失败: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}