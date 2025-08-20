import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

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
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <Link 
                    href="/"
                    className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    工作室管理系统
                  </Link>
                </div>
                <div className="flex items-center space-x-4">
                  <Link 
                    href="/members"
                    className="text-sm text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    会员管理
                  </Link>
                  <Link 
                    href="/orders"
                    className="text-sm text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    订单管理
                  </Link>
                  <Link 
                    href="/import"
                    className="text-sm text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    数据导入
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          <main>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}