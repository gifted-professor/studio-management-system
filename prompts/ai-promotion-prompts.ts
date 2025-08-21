export interface PromotionContext {
  member: {
    name: string;
    phone: string;
    totalOrders: number;
    totalAmount: number;
    lastOrderDate: Date | null;
    averageOrderValue: number;
    status: string;
    daysSinceLastOrder?: number;
  };
  orders: Array<{
    orderNumber: string;
    amount: number;
    cost: number;
    profit: number;
    profitRate: number;
    status: string;
    orderDate: Date;
    product?: string;
    category?: string;
  }>;
  followUps: Array<{
    type: string;
    content: string;
    followUpDate: Date;
    nextFollowUpDate?: Date;
  }>;
  marketTrends?: {
    seasonalFactors?: string[];
    popularProducts?: string[];
    competitorActivity?: string;
  };
  purchasePatterns?: {
    preferredPurchaseDays?: number[]; // 偏好的购买日期
    monthlyPurchaseDistribution?: {
      early: number; // 月初(1-10日)订单占比
      mid: number;   // 月中(11-20日)订单占比
      late: number;  // 月末(21-31日)订单占比
    };
    financialCycle?: 'PAYDAY_DEPENDENT' | 'FLEXIBLE' | 'STUDENT_ALLOWANCE';
    averageDaysBetweenOrders?: number;
  };
}

export const generatePromotionPrompt = (context: PromotionContext): string => {
  const { member, orders, followUps, marketTrends, purchasePatterns } = context;
  
  return `你是一位专业的运动时尚服装顾问，专门为Adidas三叶草、Lululemon等运动时尚品牌的客户提供个性化购物建议。请基于以下客户数据为 ${member.name} 制定贴心的服务方案：

## 工作室品牌定位
我们专注于Adidas三叶草、Lululemon等运动时尚品牌，主要服务15-35岁的年轻女性群体（大学生及初入职场），同时在闲鱼平台服务喜爱Nike等运动户外风格的男性客户。

## 客户基本信息
- 姓名：${member.name}
- 手机：${member.phone}
- 客户状态：${member.status}
- 总订单数：${member.totalOrders} 单
- 总消费金额：¥${member.totalAmount.toFixed(2)}
- 平均订单价值：¥${member.averageOrderValue.toFixed(2)}
- 最后下单时间：${member.lastOrderDate ? member.lastOrderDate.toLocaleDateString('zh-CN') : '无'}
${member.daysSinceLastOrder ? `- 距离上次下单：${member.daysSinceLastOrder} 天` : ''}

## 历史订单分析
${orders.length > 0 ? orders.map((order, index) => `
${index + 1}. 订单号：${order.orderNumber}
   - 金额：¥${order.amount.toFixed(2)}
   - 利润率：${(order.profitRate * 100).toFixed(1)}%
   - 状态：${order.status}
   - 下单时间：${order.orderDate.toLocaleDateString('zh-CN')}
   ${order.product ? `- 产品：${order.product}` : ''}
   ${order.category ? `- 类别：${order.category}` : ''}
`).join('') : '暂无历史订单'}

## 跟进记录
${followUps.length > 0 ? followUps.map((followUp, index) => `
${index + 1}. 跟进类型：${followUp.type}
   - 内容：${followUp.content}
   - 跟进时间：${followUp.followUpDate.toLocaleDateString('zh-CN')}
   ${followUp.nextFollowUpDate ? `- 下次跟进：${followUp.nextFollowUpDate.toLocaleDateString('zh-CN')}` : ''}
`).join('') : '暂无跟进记录'}

${marketTrends ? `## 运动时尚趋势
${marketTrends.seasonalFactors ? `- 季节性因素：${marketTrends.seasonalFactors.join('、')}` : ''}
${marketTrends.popularProducts ? `- 热门款式：${marketTrends.popularProducts.join('、')}` : ''}
${marketTrends.competitorActivity ? `- 市场动态：${marketTrends.competitorActivity}` : ''}
` : ''}

${purchasePatterns ? `## 客户购买习惯分析
${purchasePatterns.monthlyPurchaseDistribution ? `### 月度购买偏好
- 月初购买(1-10日)：${(purchasePatterns.monthlyPurchaseDistribution.early * 100).toFixed(1)}%
- 月中购买(11-20日)：${(purchasePatterns.monthlyPurchaseDistribution.mid * 100).toFixed(1)}%
- 月末购买(21-31日)：${(purchasePatterns.monthlyPurchaseDistribution.late * 100).toFixed(1)}%` : ''}
${purchasePatterns.preferredPurchaseDays ? `### 历史偏好购买日期
${purchasePatterns.preferredPurchaseDays.map(day => `${day}日`).join('、')}` : ''}
${purchasePatterns.financialCycle ? `### 消费习惯类型
${purchasePatterns.financialCycle === 'PAYDAY_DEPENDENT' ? '工资依赖型 - 建议在发薪日后联系' : 
  purchasePatterns.financialCycle === 'STUDENT_ALLOWANCE' ? '学生生活费型 - 建议在月初生活费到账后联系' : 
  '消费灵活型 - 对时间不敏感'}` : ''}
${purchasePatterns.averageDaysBetweenOrders ? `### 购买频率
平均${purchasePatterns.averageDaysBetweenOrders}天购买一次` : ''}

**重要提醒：** 请根据客户的购买习惯选择合适的促单时机，避免在客户经济紧张期推销！
` : ''}

## 请提供以下个性化服务建议：

### 1. 客户画像分析
- 判断客户属性（微信私域女性客户/闲鱼男性客户/学生党/职场新人/运动达人）
- 消费偏好分析（运动时尚/运动户外/价格敏感度）
- 潜在需求挖掘（季节性需求/搭配需求/功能性需求）

### 2. 微信沟通策略
- 沟通语调建议（亲切温暖/专业贴心/朋友式交流）
- 最佳联系时间（考虑学生和上班族作息）
- 具体话术模板（体现我们是真心为客户挑选心仪商品，而非单纯销售）

### 3. 产品推荐方案
- Adidas三叶草系列推荐（基于客户风格和场合需求）
- Lululemon瑜伽运动系列推荐（基于客户运动习惯）
- Nike户外运动系列推荐（针对闲鱼平台男性客户）
- 价格区间建议（学生友好价/品质优选价）
- 搭配建议（运动时尚全身搭配方案）

### 4. 贴心服务策略
- 个性化福利方案（体现我们为客户争取最大优惠的用心）
- 穿搭建议和使用指导
- 售后关怀和回访计划
- 会员专属服务（针对高价值客户）

### 5. 智能促单时机建议
- **购买习惯分析**：基于客户历史购买时间，分析其消费周期和财务状况
- **最佳联系时机**：推荐具体的促单日期和时间段（避开客户经济紧张期）
- **时机话术建议**：根据不同时期提供贴心的沟通方式
- **预算友好提醒**：如客户正处于经济紧张期，建议延后促单或提供分期方案

### 6. 平台差异化跟进
- 微信私域：注重情感连接和个性化服务体验
- 闲鱼平台：突出性价比和实用性，强调福利争取
- 短期行动计划（1-2周内的具体执行步骤）
- 长期关系维护（建立信任和忠诚度的策略）

**核心服务理念：** 请确保所有建议都体现我们"用心为客户挑选心仪商品，为客户争取更多福利"的服务理念。特别重要的是，要根据客户的购买习惯选择合适时机，避免在客户没钱的时候推销，体现我们的贴心和专业。沟通方式要符合年轻人的习惯，语气亲切自然。`;
};

export const QUICK_PROMOTION_TEMPLATES = {
  HIGH_VALUE_WECHAT_FEMALE: `微信高价值女性客户服务模板：
- "亲爱的[客户姓名]，作为我们的VIP客户，我为你精心挑选了几件新到的Lululemon春季新品"
- 强调个人穿搭顾问服务，提供全身搭配方案
- 分享最新的运动时尚趋势和穿搭灵感
- 提供专属试穿和退换服务，确保100%满意`,

  DORMANT_WECHAT_FEMALE: `微信沉睡女性客户唤醒模板：
- "hi～最近怎么样呀？想你了！看到Adidas出了好几款超好看的新品，第一时间想到你"
- 关心近期的运动和工作生活状态
- 分享其他客户的穿搭反馈和好评
- "我帮你争取到了老客户专享价，比平时便宜不少呢"`,

  STUDENT_BUDGET_FRIENDLY: `学生党亲民价格模板：
- "学妹/学姐，这款性价比超高！我特意为学生党们争取的福利价"
- 推荐经典款和基础款，强调百搭实用性
- 提供学生专享分期或优惠码
- "这个价格市面上真的很难找到了，我也是费了很大劲才谈下来的"`,

  WORKPLACE_NEWCOMER: `职场新人运动时尚模板：
- "刚入职场，运动时尚风绝对是最佳选择！既显活力又不失专业感"
- 推荐适合通勤和周末的versatile单品
- 分享职场穿搭小贴士和运动放松建议
- 强调投资自己形象的重要性`,

  XIANYU_MALE_CUSTOMER: `闲鱼男性客户实用导向模板：
- "兄弟，这款Nike性能真的没话说，而且我帮你拿到了比官方还低的价格"
- 重点介绍功能性和耐用性
- 分享其他客户的使用体验和运动表现
- "我跟供应商关系不错，能给你争取到内部价，机会难得"`,

  NEW_CUSTOMER_ONBOARDING: `新客户欢迎服务模板：
- "欢迎加入我们的运动时尚大家庭！我是你的专属服务顾问[服务顾问姓名]"
- 介绍我们的服务理念和品牌优势
- 提供新客户专享福利和试穿服务
- "我会根据你的喜好和需求，为你精心挑选最适合的单品"`
};

export const PROMOTION_TIMING_RULES = {
  // 微信私域客户最佳联系时间（考虑学生和上班族作息）
  WECHAT_OPTIMAL_HOURS: {
    WEEKDAY_STUDENT: [10, 11, 14, 15, 16, 20, 21], // 学生党：课间和晚上
    WEEKDAY_OFFICE: [12, 13, 18, 19, 20], // 上班族：午休和下班后
    WEEKEND: [10, 11, 14, 15, 16, 17, 19, 20, 21] // 周末较为宽松
  },
  
  // 闲鱼平台客户联系时间（男性客户作息习惯）
  XIANYU_OPTIMAL_HOURS: {
    WEEKDAY: [12, 13, 18, 19, 20, 21], // 午休和下班后
    WEEKEND: [10, 11, 14, 15, 16, 17, 18, 19, 20, 21]
  },
  
  // 避免联系的时间段
  AVOID_CONTACT_HOURS: [6, 7, 8, 22, 23, 0, 1, 2, 3, 4, 5], // 睡觉和早起时间
  
  // 不同类型客户的跟进间隔
  FOLLOW_UP_INTERVALS: {
    HIGH_VALUE_IMMEDIATE: 1, // 高价值客户立即跟进
    STUDENT_GENTLE: 3, // 学生党温和跟进，不要太频繁
    OFFICE_WORKER: 2, // 上班族适中频率
    DORMANT_REACTIVATION: 7, // 沉睡客户唤醒
    SEASONAL_PROMOTION: 14, // 季节性推广
    RELATIONSHIP_MAINTENANCE: 30 // 关系维护
  },
  
  // 特殊时段策略
  SPECIAL_TIMING: {
    PAYDAY: [25, 26, 27, 28, 29, 30, 1, 2, 3], // 发工资日前后
    STUDENT_BREAK: ['寒假', '暑假', '周末'], // 学生假期
    SHOPPING_FESTIVALS: ['双11', '618', '春节', '开学季'], // 购物节
    WEATHER_TRIGGERS: ['降温', '春季', '夏季运动'] // 天气触发
  }
};

// 购买习惯分析和促单时机建议函数
export const analyzePurchasePatterns = (orders: Array<{orderDate: Date, amount: number}>) => {
  if (orders.length < 3) {
    return {
      recommendation: '订单数量较少，建议温和培育，不急于促单',
      optimalTiming: '任何时间均可，重点关注服务体验'
    };
  }

  // 分析月度购买分布
  const monthlyDistribution = { early: 0, mid: 0, late: 0 };
  const preferredDays: number[] = [];
  
  orders.forEach(order => {
    const day = order.orderDate.getDate();
    preferredDays.push(day);
    
    if (day <= 10) monthlyDistribution.early++;
    else if (day <= 20) monthlyDistribution.mid++;
    else monthlyDistribution.late++;
  });

  const total = orders.length;
  const distribution = {
    early: monthlyDistribution.early / total,
    mid: monthlyDistribution.mid / total,
    late: monthlyDistribution.late / total
  };

  // 确定财务周期类型
  let financialCycle: 'PAYDAY_DEPENDENT' | 'FLEXIBLE' | 'STUDENT_ALLOWANCE' = 'FLEXIBLE';
  if (distribution.early > 0.6) {
    financialCycle = 'STUDENT_ALLOWANCE'; // 月初偏好，可能是学生生活费
  } else if (distribution.late > 0.5) {
    financialCycle = 'PAYDAY_DEPENDENT'; // 月末偏好，可能是发工资后
  }

  // 计算平均购买间隔
  if (orders.length >= 2) {
    const sortedOrders = orders.sort((a, b) => a.orderDate.getTime() - b.orderDate.getTime());
    let totalDays = 0;
    for (let i = 1; i < sortedOrders.length; i++) {
      const daysDiff = Math.floor((sortedOrders[i].orderDate.getTime() - sortedOrders[i-1].orderDate.getTime()) / (1000 * 60 * 60 * 24));
      totalDays += daysDiff;
    }
    const averageDaysBetweenOrders = Math.floor(totalDays / (sortedOrders.length - 1));

    return {
      monthlyPurchaseDistribution: distribution,
      preferredPurchaseDays: Array.from(new Set(preferredDays)).sort((a, b) => a - b),
      financialCycle,
      averageDaysBetweenOrders,
      recommendation: generateTimingRecommendation(distribution, financialCycle, averageDaysBetweenOrders),
      optimalTiming: generateOptimalTiming(distribution, financialCycle)
    };
  }

  return null;
};

const generateTimingRecommendation = (
  _distribution: {early: number, mid: number, late: number},
  financialCycle: string,
  _averageDays: number
): string => {
  const now = new Date();
  const currentDay = now.getDate();
  
  let recommendation = '';
  
  if (financialCycle === 'STUDENT_ALLOWANCE') {
    if (currentDay <= 10) {
      recommendation = '🎯 最佳时机！客户通常在月初消费，现在正是合适时机';
    } else if (currentDay > 25) {
      recommendation = '💰 建议等到月初再联系，客户可能正在等生活费到账';
    } else {
      recommendation = '⏰ 可以提前种草，为月初购买做准备';
    }
  } else if (financialCycle === 'PAYDAY_DEPENDENT') {
    if (currentDay >= 25 || currentDay <= 5) {
      recommendation = '💵 发薪期！客户通常这时候购买力最强';
    } else if (currentDay >= 15 && currentDay <= 24) {
      recommendation = '💸 月中资金可能紧张，建议关怀但不强推销售';
    } else {
      recommendation = '📅 可以预热新品，为发薪日后的购买做铺垫';
    }
  } else {
    recommendation = '✅ 客户消费较为灵活，任何时间都可以适度推荐';
  }
  
  return recommendation;
};

const generateOptimalTiming = (
  distribution: {early: number, mid: number, late: number},
  financialCycle: string
): string => {
  if (financialCycle === 'STUDENT_ALLOWANCE') {
    return '建议在每月1-10日联系，这是客户最活跃的购买期';
  } else if (financialCycle === 'PAYDAY_DEPENDENT') {
    return '建议在每月25日-次月5日联系，发薪日前后是最佳时机';
  } else if (distribution.mid > 0.4) {
    return '客户偏好月中购买，建议在每月10-20日联系';
  } else {
    return '客户购买时间较为灵活，可根据产品上新和优惠活动安排';
  }
};