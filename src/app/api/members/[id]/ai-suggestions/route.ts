import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePromotionPrompt, type PromotionContext } from '@/prompts/ai-promotion-prompts'

interface AISuggestion {
  id: string
  title: string
  content: string
  type: 'product_recommendation' | 'promotion' | 'retention' | 'upselling'
  priority: 'high' | 'medium' | 'low'
  reasoning: string
}

interface AISuggestionsResponse {
  suggestions: AISuggestion[]
  memberAnalysis: {
    customerSegment: string
    purchasePattern: string
    riskLevel: string
    potentialValue: string
  }
}

async function generateAISuggestions(memberData: any): Promise<AISuggestionsResponse> {
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY
  
  if (!deepseekApiKey) {
    throw new Error('DeepSeek API密钥未配置')
  }

  // 构建促单上下文数据
  const daysSinceLastOrder = memberData.lastOrderDate 
    ? Math.floor((Date.now() - new Date(memberData.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
    : undefined;

  const promotionContext: PromotionContext = {
    member: {
      name: memberData.name,
      phone: memberData.phone,
      totalOrders: memberData.totalOrders,
      totalAmount: memberData.totalAmount,
      lastOrderDate: memberData.lastOrderDate ? new Date(memberData.lastOrderDate) : null,
      averageOrderValue: memberData.totalOrders > 0 ? memberData.totalAmount / memberData.totalOrders : 0,
      status: memberData.status,
      daysSinceLastOrder
    },
    orders: memberData.orders.map((order: any) => ({
      orderNumber: order.orderNumber,
      amount: order.amount,
      cost: order.cost || 0,
      profit: order.profit || 0,
      profitRate: order.profitRate || 0,
      status: order.status,
      orderDate: new Date(order.paymentDate),
      product: order.productName,
      category: order.platform
    })),
    followUps: memberData.followUps || []
  };

  // 使用专用的促单建议 prompt
  const prompt = generatePromotionPrompt(promotionContext) + `

重要：请严格按照JSON格式返回，不要包含任何额外文字说明。所有内容必须是有效的JSON字符串，避免使用特殊符号和换行符。

{
  "memberAnalysis": {
    "customerSegment": "客户类型描述",
    "purchasePattern": "购买行为模式",
    "riskLevel": "流失风险等级",
    "potentialValue": "潜在价值评估"
  },
  "suggestions": [
    {
      "title": "建议标题",
      "content": "具体建议内容",
      "type": "product_recommendation",
      "priority": "high",
      "reasoning": "支撑理由"
    }
  ]
}`

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API请求失败: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    // 解析AI返回的JSON
    let parsedResponse
    try {
      // 直接尝试解析JSON，如果失败则使用备用方案
      try {
        parsedResponse = JSON.parse(aiResponse)
      } catch (firstError) {
        // 第一次解析失败，尝试清理后再解析
        let cleanedResponse = aiResponse.trim()
        
        // 移除可能的markdown代码块标记
        cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
        
        // 提取JSON部分
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('无法找到有效的JSON内容')
        }
      }
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError)
      console.error('原始响应:', aiResponse.substring(0, 500) + '...')
      // 返回默认建议
      return getDefaultSuggestions(memberData)
    }

    // 为每个建议添加唯一ID
    const suggestionsWithIds = parsedResponse.suggestions.map((suggestion: any, index: number) => ({
      id: `ai-${Date.now()}-${index}`,
      ...suggestion
    }))

    return {
      memberAnalysis: parsedResponse.memberAnalysis,
      suggestions: suggestionsWithIds
    }

  } catch (error) {
    console.error('DeepSeek API调用失败:', error)
    // 返回默认建议
    return getDefaultSuggestions(memberData)
  }
}

function getDefaultSuggestions(memberData: any): AISuggestionsResponse {
  const suggestions: AISuggestion[] = []
  
  // 基于简单规则生成默认建议
  if (memberData.totalOrders === 0) {
    suggestions.push({
      id: `default-${Date.now()}-1`,
      title: '首单激励',
      content: '为新客户提供首单优惠券，降低购买门槛，促成首次交易',
      type: 'promotion',
      priority: 'high',
      reasoning: '该客户暂无购买记录，需要通过优惠活动激发首次购买意愿'
    })
  }
  
  if (memberData.lastOrderDate && memberData.totalOrders > 0) {
    const daysSinceLastOrder = Math.floor((Date.now() - new Date(memberData.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceLastOrder > 30) {
      suggestions.push({
        id: `default-${Date.now()}-2`,
        title: '召回营销',
        content: '通过个性化召回活动重新激活沉睡客户，可使用限时折扣或专属礼品',
        type: 'retention',
        priority: 'high',
        reasoning: `客户已${daysSinceLastOrder}天未下单，存在流失风险`
      })
    }
  }
  
  if ((memberData.returnRate || 0) < 20 && memberData.totalAmount > 1000) {
    suggestions.push({
      id: `default-${Date.now()}-3`,
      title: '优质客户升级',
      content: '邀请加入VIP会员计划，提供专属服务和优先购买权',
      type: 'upselling',
      priority: 'medium',
      reasoning: '客户退货率低且消费金额较高，具备升级为VIP的潜质'
    })
  }

  return {
    memberAnalysis: {
      customerSegment: '待分析',
      purchasePattern: '数据不足',
      riskLevel: '中等',
      potentialValue: '需进一步观察'
    },
    suggestions
  }
}

// GET 接口：获取已保存的AI建议
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    // 获取最新的AI建议
    const savedSuggestions = await prisma.aISuggestion.findMany({
      where: {
        memberId: id,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (savedSuggestions.length === 0) {
      return NextResponse.json({
        hasSavedSuggestions: false,
        suggestions: [],
        memberAnalysis: null
      })
    }

    // 将数据库中的建议转换为前端需要的格式
    const firstSuggestion = savedSuggestions[0]
    const memberAnalysis = {
      customerSegment: firstSuggestion.customerSegment || '待分析',
      purchasePattern: firstSuggestion.purchasePattern || '数据不足',
      riskLevel: firstSuggestion.riskLevel || '中等',
      potentialValue: firstSuggestion.potentialValue || '需进一步观察'
    }

    const suggestions = savedSuggestions.map(suggestion => ({
      id: suggestion.id,
      title: suggestion.title,
      content: suggestion.content,
      type: suggestion.type as 'product_recommendation' | 'promotion' | 'retention' | 'upselling',
      priority: suggestion.priority as 'high' | 'medium' | 'low',
      reasoning: suggestion.reasoning
    }))

    return NextResponse.json({
      hasSavedSuggestions: true,
      suggestions,
      memberAnalysis,
      generatedAt: firstSuggestion.createdAt,
      lastUpdated: firstSuggestion.updatedAt
    })
  } catch (error) {
    console.error('获取AI建议失败:', error)
    return NextResponse.json(
      { error: '获取建议失败，请稍后重试' },
      { status: 500 }
    )
  }
}

// POST 接口：生成新的AI建议并保存
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    // 获取会员详细信息
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { paymentDate: 'desc' },
          take: 10 // 最近10个订单用于分析
        },
        followUps: {
          orderBy: { followUpDate: 'desc' },
          take: 5 // 最近5条跟进记录
        },
        _count: {
          select: { orders: true, followUps: true }
        }
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: '会员不存在' },
        { status: 404 }
      )
    }

    // 生成AI建议
    console.log('开始生成AI建议，会员ID:', id);
    const aiSuggestions = await generateAISuggestions(member);
    console.log('AI建议生成成功:', aiSuggestions);

    // 开始数据库事务：先删除旧建议，再保存新建议
    await prisma.$transaction(async (tx) => {
      // 将该会员的所有旧建议标记为非活跃
      await tx.aISuggestion.updateMany({
        where: {
          memberId: id,
          isActive: true
        },
        data: {
          isActive: false
        }
      })

      // 保存新的建议
      const createData = aiSuggestions.suggestions.map(suggestion => ({
        memberId: id,
        title: suggestion.title,
        content: suggestion.content,
        type: suggestion.type,
        priority: suggestion.priority,
        reasoning: suggestion.reasoning,
        customerSegment: aiSuggestions.memberAnalysis.customerSegment,
        purchasePattern: aiSuggestions.memberAnalysis.purchasePattern,
        riskLevel: aiSuggestions.memberAnalysis.riskLevel,
        potentialValue: aiSuggestions.memberAnalysis.potentialValue,
        isActive: true
      }))

      await tx.aISuggestion.createMany({
        data: createData
      })
    })

    return NextResponse.json(aiSuggestions)
  } catch (error) {
    console.error('生成AI建议失败:', error)
    return NextResponse.json(
      { error: '生成建议失败，请稍后重试' },
      { status: 500 }
    )
  }
}