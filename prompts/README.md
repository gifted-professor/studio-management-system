# AI 促单建议 Prompts

## 📍 快速导航

- **促单建议主文件**: [`ai-promotion-prompts.ts`](./ai-promotion-prompts.ts)
- **配置文件**: [`prompt-config.ts`](./prompt-config.ts)

## 📋 文件说明

### `ai-promotion-prompts.ts`
包含所有促单建议相关的 prompt 模板和配置：
- 动态生成的个性化促单 prompt
- 快速模板（高价值客户、沉睡客户等）
- 联系时机规则

### `prompt-config.ts`
集中管理所有 prompt 的配置和映射关系

## 🚀 使用方法

```typescript
import { generatePromotionPrompt, QUICK_PROMOTION_TEMPLATES } from '@/prompts/ai-promotion-prompts'

// 生成个性化促单建议
const prompt = generatePromotionPrompt(promotionContext)

// 使用快速模板
const template = QUICK_PROMOTION_TEMPLATES.HIGH_VALUE_CUSTOMER
```

## 🔧 自定义配置

修改 `prompt-config.ts` 可以调整：
- Prompt 模板
- 联系时机规则
- 客户分类标准
- 优惠策略模板