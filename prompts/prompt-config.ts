/**
 * 🎯 AI Prompts 配置中心
 * 
 * 这个文件集中管理所有 AI 相关的 prompts 配置
 * 方便查找、修改和维护
 */

export const PROMPT_REGISTRY = {
  // 促单建议相关
  PROMOTION: {
    file: './ai-promotion-prompts.ts',
    description: '客户促单建议生成',
    functions: [
      'generatePromotionPrompt',
      'QUICK_PROMOTION_TEMPLATES',
      'PROMOTION_TIMING_RULES'
    ]
  },
  
  // 未来可扩展的其他 AI 功能
  CUSTOMER_SERVICE: {
    file: './customer-service-prompts.ts',
    description: '客服自动回复',
    functions: [],
    status: 'planned'
  },
  
  ORDER_ANALYSIS: {
    file: './order-analysis-prompts.ts', 
    description: '订单数据分析',
    functions: [],
    status: 'planned'
  }
};

/**
 * 快速访问映射
 * 常用的 prompt 函数直接导出，方便使用
 */
export { 
  generatePromotionPrompt,
  QUICK_PROMOTION_TEMPLATES,
  PROMOTION_TIMING_RULES,
  type PromotionContext
} from './ai-promotion-prompts';

/**
 * Prompt 配置常量
 */
export const PROMPT_CONFIG = {
  // AI 模型配置
  MODEL_SETTINGS: {
    temperature: 0.7,
    max_tokens: 2000,
    top_p: 0.9
  },
  
  // 输出格式要求
  OUTPUT_FORMAT: {
    language: 'zh-CN',
    json_strict: true,
    max_suggestions: 5
  },
  
  // 业务规则
  BUSINESS_RULES: {
    min_order_amount: 100,
    vip_threshold: 5000,
    dormant_days: 30,
    high_frequency_orders: 10
  }
};

/**
 * 获取 Prompt 信息
 */
export function getPromptInfo(category: keyof typeof PROMPT_REGISTRY) {
  return PROMPT_REGISTRY[category];
}

/**
 * 列出所有可用的 Prompts
 */
export function listAllPrompts() {
  return Object.entries(PROMPT_REGISTRY).map(([key, value]) => ({
    category: key,
    ...value
  }));
}