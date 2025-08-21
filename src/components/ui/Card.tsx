import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  clickable?: boolean
  gradient?: boolean
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function Card({ 
  children, 
  className, 
  hover = true, 
  clickable = false, 
  gradient = false 
}: CardProps) {
  return (
    <div
      className={cn(
        // 基础卡片样式
        "bg-card rounded-xl shadow-sm border border-border",
        // 悬停效果
        hover && "hover:shadow-md transition-all duration-300",
        // 可点击样式
        clickable && "cursor-pointer hover:border-primary/30 group",
        // 渐变背景
        gradient && "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("p-6 pb-4", className)}>
      {children}
    </div>
  )
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn("px-6 pb-6", className)}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn("px-6 pt-4 pb-6", className)}>
      {children}
    </div>
  )
}

// 常用的卡片变体组件
export function StatsCard({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  className 
}: {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}) {
  const trendColors = {
    up: 'text-chart-1',
    down: 'text-destructive',
    neutral: 'text-muted-foreground'
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className={cn(
              "text-2xl font-bold",
              trend ? trendColors[trend] : 'text-foreground'
            )}>
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {icon && (
            <div className="text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function LoadingCard({ message = '加载中...' }: { message?: string }) {
  return (
    <Card>
      <CardContent className="p-12">
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <div className="animate-spin h-12 w-12 text-primary">
              <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            </div>
            <div className="absolute inset-0 bg-primary/20 rounded-full opacity-20 animate-ping"></div>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">{message}</h3>
        </div>
      </CardContent>
    </Card>
  )
}

export function EmptyCard({ 
  title, 
  description, 
  action, 
  icon 
}: {
  title: string
  description: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-12">
        <div className="text-center">
          {icon && (
            <div className="mx-auto w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
              {icon}
            </div>
          )}
          <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-muted-foreground mb-8">{description}</p>
          {action}
        </div>
      </CardContent>
    </Card>
  )
}