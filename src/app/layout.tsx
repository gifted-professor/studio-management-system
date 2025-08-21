import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '工作室管理系统',
  description: '工作室会员管理与催单系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {/* 左侧固定导航 + 右侧主内容区 */}
          <div className="flex">
            {/* 左侧导航栏 - 固定宽度 */}
            <Sidebar />
            
            {/* 右侧主内容区 - 浅灰色背景，有呼吸感 */}
            <main className="flex-1 ml-64 min-h-screen bg-muted/30">
              <div className="p-6 space-y-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}