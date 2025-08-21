'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { 
  Clock, 
  AlertTriangle, 
  Crown,
  Calendar,
  CheckSquare,
  Target,
  TrendingUp,
  Users,
  ShoppingCart,
  Phone,
  ArrowRight,
  Star,
  Gift,
  Zap
} from 'lucide-react'

// 核心行动指标数据结构
interface ActionableKPIs {
  monthlyFollowUps: number
  riskMembers: number
  highValueDormant: number
  upcomingBirthdays: number
}

// 今日跟进任务
interface TodayTask {
  id: number
  memberId: number
  memberName: string
  memberPhone: string
  followUpType: string
  content: string
  lastOrderDate?: string
  totalAmount: number
  orderInfo?: {
    productName: string
    amount: number
    paymentDate: string
  }
  scheduledTime?: string
  operator?: string
}

// 智能促单机会
interface SmartOpportunity {
  id: string
  type: 'dormant_high_value' | 'cross_sell' | 'vip_upgrade' | 'birthday_reminder'
  memberId: number
  memberName: string
  message: string
  urgency: 'high' | 'medium' | 'low'
  actionButton: string
  memberPhone?: string
  data?: any
}

// 热销品与潜力客户
interface HotProduct {
  productName: string
  salesCount: number
  totalAmount: number
  avgAmount: number
  potentialCustomers: Array<{
    memberId: number
    memberName: string
    memberPhone: string
    similarity: string
    lastOrderAmount: number
    totalAmount: number
  }>
}

export default function DashboardPage() {
  // 状态管理
  const [kpiData, setKpiData] = useState<ActionableKPIs | null>(null)
  const [todayTasks, setTodayTasks] = useState<TodayTask[]>([])
  const [smartOpportunities, setSmartOpportunities] = useState<SmartOpportunity[]>([])
  const [hotProducts, setHotProducts] = useState<HotProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取数据的函数
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 并行获取所有数据
      const [kpisRes, tasksRes, opportunitiesRes, hotProductsRes] = await Promise.all([
        fetch('/api/dashboard/kpis'),
        fetch('/api/dashboard/today-tasks'),
        fetch('/api/dashboard/smart-opportunities'),
        fetch('/api/dashboard/hot-products')
      ])

      // 检查响应状态
      if (!kpisRes.ok || !tasksRes.ok || !opportunitiesRes.ok || !hotProductsRes.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      // 解析数据
      const [kpisData, tasksData, opportunitiesData, hotProductsData] = await Promise.all([
        kpisRes.json(),
        tasksRes.json(),
        opportunitiesRes.json(),
        hotProductsRes.json()
      ])

      // 设置状态
      setKpiData(kpisData.data)
      setTodayTasks(tasksData.data || [])
      setSmartOpportunities(opportunitiesData.data || [])
      setHotProducts(hotProductsData.data || [])
    } catch (err) {
      console.error('Dashboard data fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // 页面加载时获取数据
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // 错误和加载状态组件
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card rounded-xl shadow-sm border border-border p-5">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/3 mb-1"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-destructive mb-2">数据加载错误</h2>
          <p className="text-destructive/80 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg hover:bg-destructive/90 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/30'
      case 'medium': return 'bg-chart-2/10 text-chart-2 border-chart-2/30'
      case 'low': return 'bg-chart-1/10 text-chart-1 border-chart-1/30'
      default: return 'bg-muted/10 text-muted-foreground border-muted/30'
    }
  }

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT_REMINDER': return <Clock className="h-4 w-4 text-chart-2" />
      case 'ORDER_INQUIRY': return <ShoppingCart className="h-4 w-4 text-chart-1" />
      case 'RETURN_INQUIRY': return <Phone className="h-4 w-4 text-chart-3" />
      default: return <CheckSquare className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              促单行动中心
            </h1>
            <p className="text-muted-foreground">
              基于数据分析的智能促单指挥台，让每一次跟进都精准有效
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">今日</div>
            <div className="text-lg font-semibold text-foreground">
              {new Date().toLocaleDateString('zh-CN', { 
                month: 'long', 
                day: 'numeric',
                weekday: 'short'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 核心行动指标 - 顶部四个并列卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 本月待跟进会员 */}
        <div className="bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition-all duration-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-chart-1/20">
              <CheckSquare className="h-5 w-5 text-chart-1" />
            </div>
            <Link 
              href="/followups"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              查看全部 →
            </Link>
          </div>
          <h3 className="font-semibold text-foreground mb-1">本月待跟进</h3>
          <div className="text-2xl font-bold text-chart-1 mb-2">{kpiData?.monthlyFollowUps || 0}</div>
          <p className="text-sm text-muted-foreground">个跟进任务</p>
        </div>

        {/* 流失风险会员 */}
        <div className="bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition-all duration-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-chart-2/20">
              <AlertTriangle className="h-5 w-5 text-chart-2" />
            </div>
            <Link 
              href="/members?filter=risk"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              查看详情 →
            </Link>
          </div>
          <h3 className="font-semibold text-foreground mb-1">流失风险会员</h3>
          <div className="text-2xl font-bold text-chart-2 mb-2">{kpiData?.riskMembers || 0}</div>
          <p className="text-sm text-muted-foreground">30-90天未复购</p>
        </div>

        {/* 高价值沉睡会员 */}
        <div className="bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition-all duration-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-destructive/20">
              <Crown className="h-5 w-5 text-destructive" />
            </div>
            <Link 
              href="/members?filter=high_value_dormant"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              重点关注 →
            </Link>
          </div>
          <h3 className="font-semibold text-foreground mb-1">高价值沉睡会员</h3>
          <div className="text-2xl font-bold text-destructive mb-2">{kpiData?.highValueDormant || 0}</div>
          <p className="text-sm text-muted-foreground">高消费但90天+未购买</p>
        </div>

        {/* 近期生日会员 */}
        <div className="bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition-all duration-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-chart-3/20">
              <Gift className="h-5 w-5 text-chart-3" />
            </div>
            <Link 
              href="/members?filter=birthday"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              生日关怀 →
            </Link>
          </div>
          <h3 className="font-semibold text-foreground mb-1">近期生日会员</h3>
          <div className="text-2xl font-bold text-chart-3 mb-2">{kpiData?.upcomingBirthdays || 0}</div>
          <p className="text-sm text-muted-foreground">30天内生日</p>
        </div>
      </div>

      {/* 主要内容区 - 任务与机会列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧 - 今日待办和智能机会 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 今日跟进任务卡片 */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  我的今日跟进任务
                </h2>
                <p className="text-sm text-muted-foreground">
                  今天需要联系的客户，点击姓名可直接查看详情
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{todayTasks.length}</div>
                <div className="text-sm text-muted-foreground">待处理</div>
              </div>
            </div>

            <div className="space-y-3">
              {todayTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  今日暂无跟进任务
                </div>
              ) : (
                todayTasks.map((task) => (
                  <div key={task.id} className="bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {getTaskTypeIcon(task.followUpType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link 
                            href={`/members/${task.memberId || task.id}`}
                            className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                          >
                            {task.memberName}
                          </Link>
                          <span className="text-sm text-muted-foreground">{task.memberPhone}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{task.content}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>最后下单: {task.lastOrderDate}</span>
                          <span>累计消费: ¥{task.totalAmount}</span>
                        </div>
                      </div>
                    </div>
                    <button className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-3 py-1.5 rounded-lg transition-colors">
                      立即跟进
                    </button>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>

          {/* 智能促单机会卡片 */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-chart-2" />
                  智能促单机会
                </h2>
                <p className="text-sm text-muted-foreground">
                  AI分析推荐的高转化促单机会，配备现成话术
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {smartOpportunities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无智能促单机会
                </div>
              ) : (
                smartOpportunities.map((opportunity) => (
                  <div key={opportunity.id} className="border border-border rounded-lg p-4 hover:border-primary/30 hover:bg-muted/20 transition-all duration-200 group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Link 
                          href={`/members/${opportunity.memberId}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer hover:underline group-hover:text-primary"
                        >
                          {opportunity.memberName}
                        </Link>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getUrgencyColor(opportunity.urgency)}`}>
                          {opportunity.urgency === 'high' ? '高优先级' : opportunity.urgency === 'medium' ? '中优先级' : '低优先级'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{opportunity.message}</p>
                      {opportunity.memberPhone && (
                        <p className="text-xs text-muted-foreground">联系方式: {opportunity.memberPhone}</p>
                      )}
                    </div>
                    <Link 
                      href={`/members/${opportunity.memberId}`}
                      className="bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-sm text-xs px-3 py-1.5 rounded-lg transition-all duration-200 ml-3 inline-block group-hover:bg-primary group-hover:text-primary-foreground"
                    >
                      {opportunity.actionButton}
                    </Link>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 右侧 - 热销品与潜力客户 */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
                  <Target className="h-5 w-5 text-chart-3" />
                  热销品推荐
                </h3>
                <p className="text-sm text-muted-foreground">上月热销 + 精准客户匹配</p>
              </div>
            </div>

            <div className="space-y-4">
              {hotProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无热销品数据
                </div>
              ) : (
                hotProducts.map((product, index) => (
                  <div key={index} className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-foreground">{product.productName}</h4>
                    <span className="text-sm bg-chart-1/20 text-chart-1 px-2 py-1 rounded-full">
                      售出 {product.salesCount} 件
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-foreground">潜力客户:</h5>
                    {product.potentialCustomers.map((customer, idx) => (
                      <div key={idx} className="bg-background rounded p-3 text-sm hover:bg-muted/30 transition-colors border border-transparent hover:border-primary/20">
                        <div className="flex items-center justify-between mb-1">
                          <Link 
                            href={`/members/${customer.memberId}`}
                            className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer hover:underline"
                          >
                            {customer.memberName}
                          </Link>
                          <span className="text-xs text-muted-foreground">{customer.memberPhone}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span>{customer.similarity}</span> • 
                          <span className="ml-1">最近消费 ¥{customer.lastOrderAmount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                ))
              )}
            </div>
          </div>

          {/* 快速数据卡片 */}
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl shadow-lg text-primary-foreground p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-6 w-6" />
              <h3 className="text-lg font-semibold">本月业绩</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-primary-foreground/80">跟进成功率</span>
                <span className="font-semibold">68%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-foreground/80">转化订单</span>
                <span className="font-semibold">24 单</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-foreground/80">新增销售</span>
                <span className="font-semibold">¥12,580</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}