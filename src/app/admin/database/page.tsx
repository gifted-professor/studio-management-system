"use client";

import { useState } from "react";
import { Database, Play, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function DatabaseAdminPage() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const initializeDatabase = async () => {
    setIsInitializing(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/init-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "初始化失败");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误");
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="text-center mb-8">
            <Database className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              数据库管理控制台
            </h1>
            <p className="text-gray-600">
              初始化生产环境数据库，创建表结构和示例数据
            </p>
          </div>

          <div className="space-y-6">
            {/* 初始化按钮 */}
            <div className="text-center">
              <button
                onClick={initializeDatabase}
                disabled={isInitializing}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isInitializing ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    初始化中...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    初始化数据库
                  </>
                )}
              </button>
            </div>

            {/* 成功结果 */}
            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-green-800">
                    初始化成功！
                  </h3>
                </div>
                <div className="space-y-2 text-sm text-green-700">
                  <p>✅ {result.message}</p>
                  <p>📊 会员数量: {result.data.memberCount}</p>
                  <p>📦 订单数量: {result.data.orderCount}</p>
                  <p>⏰ 完成时间: {new Date(result.data.timestamp).toLocaleString('zh-CN')}</p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-sm text-green-600 mb-2">下一步操作：</p>
                  <div className="space-y-1 text-sm">
                    <a 
                      href="/members" 
                      className="block text-blue-600 hover:text-blue-800 underline"
                    >
                      → 查看会员管理页面
                    </a>
                    <a 
                      href="/" 
                      className="block text-blue-600 hover:text-blue-800 underline"
                    >
                      → 返回系统首页
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* 错误信息 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
                  <h3 className="text-lg font-semibold text-red-800">
                    初始化失败
                  </h3>
                </div>
                <p className="text-sm text-red-700 mb-4">{error}</p>
                
                <div className="text-sm text-red-600 space-y-1">
                  <p className="font-medium">可能的解决方案：</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>检查环境变量 DATABASE_URL 是否正确配置</li>
                    <li>确认数据库服务是否正常运行</li>
                    <li>检查网络连接是否正常</li>
                    <li>查看 Vercel 函数日志获取详细错误信息</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 说明信息 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">操作说明</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• 此操作会检查并创建必要的数据库表结构</li>
                <li>• 如果数据库为空，会自动创建示例数据</li>
                <li>• 如果已有数据，不会重复创建</li>
                <li>• 整个过程是安全的，不会删除现有数据</li>
              </ul>
            </div>

            {/* 环境信息 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">环境信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">环境:</span>
                  <span className="ml-2 text-gray-600">
                    {process.env.NODE_ENV || '未知'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">数据库:</span>
                  <span className="ml-2 text-gray-600">
                    {process.env.DATABASE_URL?.includes('postgresql') ? 'PostgreSQL' : 'SQLite'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}