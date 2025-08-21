export type ActivityLevel = 
  | 'HIGHLY_ACTIVE'     // 1个月内2次及以上下单
  | 'ACTIVE'            // 1个月内1次下单  
  | 'SLIGHTLY_INACTIVE' // 1-3个月内最后一次下单
  | 'MODERATELY_INACTIVE' // 3-6个月内最后一次下单
  | 'HEAVILY_INACTIVE'  // 6-12个月内最后一次下单
  | 'DEEPLY_INACTIVE';  // 12个月以上未下单

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  HIGHLY_ACTIVE: '高活跃',
  ACTIVE: '活跃',
  SLIGHTLY_INACTIVE: '轻度流失',
  MODERATELY_INACTIVE: '中度流失', 
  HEAVILY_INACTIVE: '重度流失',
  DEEPLY_INACTIVE: '深度流失'
};

export const ACTIVITY_STRATEGIES: Record<ActivityLevel, string> = {
  HIGHLY_ACTIVE: '重点维护，提供VIP服务',
  ACTIVE: '保持关注，适时推荐新品',
  SLIGHTLY_INACTIVE: '主动触达，了解需求，发送优惠券',
  MODERATELY_INACTIVE: '重点挽回，电话/微信深度沟通',
  HEAVILY_INACTIVE: '强力挽回活动，特价促销',
  DEEPLY_INACTIVE: '最后挽回尝试，或转为观察状态'
};

/**
 * 根据最后下单日期和订单数量计算会员活跃度
 */
export function calculateActivityLevel(
  lastOrderDate: Date | null,
  totalOrdersInLastMonth: number
): ActivityLevel {
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

/**
 * 获取活跃度对应的颜色样式
 */
export function getActivityLevelColor(level: ActivityLevel): string {
  const colors: Record<ActivityLevel, string> = {
    HIGHLY_ACTIVE: 'text-green-600 bg-green-100',
    ACTIVE: 'text-blue-600 bg-blue-100', 
    SLIGHTLY_INACTIVE: 'text-yellow-600 bg-yellow-100',
    MODERATELY_INACTIVE: 'text-orange-600 bg-orange-100',
    HEAVILY_INACTIVE: 'text-red-600 bg-red-100',
    DEEPLY_INACTIVE: 'text-gray-600 bg-gray-100'
  };
  
  return colors[level] || 'text-gray-600 bg-gray-100';
}