import Link from 'next/link'
import { Users, ShoppingCart, Phone, BarChart3 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            欢迎使用工作室管理系统
          </h2>
          <p className="text-muted-foreground text-lg">
            管理会员信息、订单数据和催单记录
          </p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 会员管理 */}
        <Link href="/members" className="group">
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border hover:shadow-md hover:bg-accent/5 transition-all duration-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-card-foreground">
                会员管理
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              查看和管理会员信息，跟踪会员订单历史
            </p>
          </div>
        </Link>

        {/* 订单管理 */}
        <Link href="/orders" className="group">
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border hover:shadow-md hover:bg-accent/5 transition-all duration-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-chart-2/20 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-chart-2" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-card-foreground">
                订单管理
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              管理订单状态，跟踪支付和发货信息
            </p>
          </div>
        </Link>

        {/* 催单管理 */}
        <Link href="/followups" className="group">
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border hover:shadow-md hover:bg-accent/5 transition-all duration-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-destructive/10 rounded-lg">
                <Phone className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-card-foreground">
                催单管理
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              记录催单历史，安排后续跟进
            </p>
          </div>
        </Link>

        {/* 数据统计 */}
        <Link href="/dashboard" className="group">
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border hover:shadow-md hover:bg-accent/5 transition-all duration-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-chart-3/20 rounded-lg">
                <BarChart3 className="h-6 w-6 text-chart-3" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-card-foreground">
                数据统计
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              查看销售数据和会员统计信息
            </p>
          </div>
        </Link>
      </div>

        {/* 快速操作 */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-foreground mb-6">快速操作</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link 
              href="/members/new" 
              className="bg-card p-6 rounded-lg border border-border hover:shadow-sm hover:bg-secondary/5 transition-all duration-200 text-center group"
            >
              <div className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">添加新会员</div>
              <div className="text-xs text-muted-foreground mt-2">快速添加新的会员信息</div>
            </Link>
            
            <Link 
              href="/orders/new" 
              className="bg-card p-6 rounded-lg border border-border hover:shadow-sm hover:bg-secondary/5 transition-all duration-200 text-center group"
            >
              <div className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">创建订单</div>
              <div className="text-xs text-muted-foreground mt-2">为会员创建新订单</div>
            </Link>
            
            <Link 
              href="/import" 
              className="bg-card p-6 rounded-lg border border-border hover:shadow-sm hover:bg-secondary/5 transition-all duration-200 text-center group"
            >
              <div className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">导入数据</div>
              <div className="text-xs text-muted-foreground mt-2">从Excel导入会员和订单数据</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}