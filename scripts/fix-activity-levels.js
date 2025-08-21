const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 活跃度计算函数
function calculateActivityLevel(lastOrderDate, totalOrdersInLastMonth) {
  if (!lastOrderDate) {
    return 'DEEPLY_INACTIVE';
  }

  const now = new Date();
  const daysSinceLastOrder = Math.floor(
    (now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 1个月内有多次下单
  if (daysSinceLastOrder <= 30) {
    return totalOrdersInLastMonth >= 2 ? 'HIGHLY_ACTIVE' : 'ACTIVE';
  }
  
  // 1-3个月
  if (daysSinceLastOrder <= 90) {
    return 'SLIGHTLY_INACTIVE';
  }
  
  // 3-6个月
  if (daysSinceLastOrder <= 180) {
    return 'MODERATELY_INACTIVE';
  }
  
  // 6-12个月
  if (daysSinceLastOrder <= 365) {
    return 'HEAVILY_INACTIVE';
  }
  
  // 12个月以上
  return 'DEEPLY_INACTIVE';
}

async function fixActivityLevels() {
  try {
    console.log('开始修复会员活跃度...');
    
    const members = await prisma.member.findMany({
      select: {
        id: true,
        name: true,
        lastOrderDate: true,
        activityLevel: true
      }
    });

    console.log(`找到 ${members.length} 个会员`);
    
    let updatedCount = 0;
    let batchSize = 50; // 批量处理，提升性能
    
    for (let i = 0; i < members.length; i += batchSize) {
      const batch = members.slice(i, i + batchSize);
      
      for (const member of batch) {
        // 计算最近30天订单数
        let totalOrdersInLastMonth = 0;
        if (member.lastOrderDate) {
          const oneMonthAgo = new Date();
          oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
          
          totalOrdersInLastMonth = await prisma.order.count({
            where: {
              memberId: member.id,
              paymentDate: {
                gte: oneMonthAgo,
                not: null
              }
            }
          });
        }

        const correctActivityLevel = calculateActivityLevel(
          member.lastOrderDate,
          totalOrdersInLastMonth
        );

        // 只更新需要修复的会员
        if (member.activityLevel !== correctActivityLevel) {
          await prisma.member.update({
            where: { id: member.id },
            data: { activityLevel: correctActivityLevel }
          });
          
          console.log(`修复会员 ${member.name}: ${member.activityLevel} → ${correctActivityLevel}`);
          updatedCount++;
        }
      }
      
      console.log(`处理进度: ${Math.min(i + batchSize, members.length)}/${members.length}`);
    }

    console.log(`修复完成！共修复 ${updatedCount} 个会员的活跃度`);
  } catch (error) {
    console.error('修复活跃度失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixActivityLevels();