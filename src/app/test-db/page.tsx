"use client";

import { useState, useEffect } from "react";

export default function TestDBPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    testDatabase();
  }, []);

  const testDatabase = async () => {
    try {
      setLoading(true);
      setError("");
      
      // 测试基本API连接
      const response = await fetch('/api/members?limit=3');
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      setResult(data);
      
    } catch (err) {
      console.error('数据库测试错误:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold mb-6">数据库连接测试</h1>
          
          <button
            onClick={testDatabase}
            disabled={loading}
            className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "测试中..." : "重新测试"}
          </button>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
              <h3 className="font-semibold text-red-800 mb-2">连接失败</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <h3 className="font-semibold text-green-800 mb-2">连接成功！</h3>
                <p className="text-green-700">
                  成功获取到 {result.data?.length || 0} 条会员记录
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <h4 className="font-semibold mb-2">响应数据:</h4>
                <pre className="text-xs overflow-auto max-h-96 bg-gray-100 p-2 rounded">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-semibold text-blue-800 mb-2">环境信息:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>当前时间: {new Date().toLocaleString()}</li>
              <li>用户代理: {navigator.userAgent.substring(0, 100)}...</li>
              <li>当前域名: {window.location.hostname}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}