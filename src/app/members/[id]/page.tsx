"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  Store,
  RefreshCw,
  AlertTriangle,
  ArrowUpDown,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import AISuggestions from "@/components/AISuggestions";

interface Order {
  id: number;
  orderNo?: string;
  paymentDate?: string;
  platform?: string;
  productName?: string;
  amount?: number;
  costPrice?: number;
  profit?: number;
  status: string;
  responsiblePerson?: string;
  manufacturer?: string;
  size?: string;
  color?: string;
  courierCompany?: string;
  remarks?: string;
  refundResponsible?: string | null;
  refundDate?: string | null;
  refundAmount?: number | null;
  refundType?: string | null;
  refundReason?: string | null;
  returnTrackingNo?: string | null;
  returnAddress?: string | null;
  createdAt: string;
}

interface Member {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  status: string;
  totalOrders: number;
  totalAmount: number;
  lastOrderDate?: string;
  returnRate?: number;
  createdAt: string;
  orders: Order[];
  _count: {
    orders: number;
    followUps: number;
  };
}

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const fetchMemberDetail = async (orderSort: 'desc' | 'asc' = sortOrder) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/members/${params.id}?sortOrder=${orderSort}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("会员不存在");
        } else {
          setError("获取会员信息失败");
        }
        return;
      }

      const data: Member = await response.json();
      setMember(data);
    } catch (error) {
      console.error("获取会员详情失败:", error);
      setError("获取会员信息失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchMemberDetail();
    }
  }, [params.id]);

  const handleSortToggle = () => {
    const newSortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newSortOrder);
    fetchMemberDetail(newSortOrder);
  };

  const getStatusText = (status: string) => {
    return status === "ACTIVE" ? "活跃" : "非活跃";
  };

  const getStatusColor = (status: string) => {
    return status === "ACTIVE"
      ? "text-green-800 bg-green-100"
      : "text-gray-800 bg-gray-100";
  };

  const getOrderStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "待处理",
      PAID: "已付款",
      SHIPPED: "已发货",
      COMPLETED: "已完成",
      CANCELLED: "已取消",
    };
    return statusMap[status] || status;
  };

  const getOrderStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      PENDING: "text-yellow-800 bg-yellow-100",
      PAID: "text-blue-800 bg-blue-100",
      SHIPPED: "text-purple-800 bg-purple-100",
      COMPLETED: "text-green-800 bg-green-100",
      CANCELLED: "text-red-800 bg-red-100",
    };
    return colorMap[status] || "text-gray-800 bg-gray-100";
  };

  const getReturnRateLevel = (returnRate?: number) => {
    if (returnRate === undefined || returnRate === null) return "未知";
    if (returnRate < 30) return "低";
    if (returnRate < 60) return "中";
    return "高";
  };

  const getReturnRateColor = (returnRate?: number) => {
    if (returnRate === undefined || returnRate === null) return "text-gray-600";
    if (returnRate < 30) return "text-green-600";
    if (returnRate < 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {error || "会员不存在"}
          </h3>
          <div className="mt-6">
            <button
              onClick={() => router.push("/members")}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              返回会员列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 返回按钮 */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/members")}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回会员列表
        </button>
      </div>

      {/* 会员信息卡片 */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-xl font-medium text-gray-700">
                    {member.name.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-6">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {member.name}
                  </h1>
                  <span
                    className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      member.status
                    )}`}
                  >
                    {getStatusText(member.status)}
                  </span>
                </div>
                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                  {member.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {member.phone}
                    </div>
                  )}
                  {member.address && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {member.address}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Package className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-900">总订单数</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {member.totalOrders}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    总消费金额
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(member.totalAmount)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-purple-900">
                    最后下单
                  </p>
                  <p className="text-sm font-bold text-purple-900">
                    {member.lastOrderDate
                      ? formatDate(member.lastOrderDate)
                      : "暂无"}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <RefreshCw className="h-5 w-5 text-gray-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">退货率</p>
                  <p
                    className={`text-2xl font-bold ${getReturnRateColor(
                      member.returnRate
                    )}`}
                  >
                    {getReturnRateLevel(member.returnRate)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {member.returnRate !== undefined &&
                    member.returnRate !== null
                      ? `${member.returnRate.toFixed(1)}%`
                      : "暂无数据"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI 促单建议 */}
      <div className="mb-6">
        <AISuggestions memberId={member.id} />
      </div>

      {/* 订单列表 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">订单历史</h2>
          <button
            onClick={handleSortToggle}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {sortOrder === 'desc' ? '最新在前' : '最早在前'}
          </button>
        </div>

        {member.orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无订单</h3>
            <p className="mt-1 text-sm text-gray-500">
              该会员还没有任何订单记录。
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    单号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    付款日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    出售平台
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    收款额
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    退款类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    退款原因
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    退回单号
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {member.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    {/* 单号 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderNo || "无订单号"}
                        </div>
                      </div>
                    </td>

                    {/* 付款日期 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.paymentDate
                        ? formatDate(order.paymentDate)
                        : "未设置"}
                    </td>

                    {/* 出售平台 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Store className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {order.platform || "未设置"}
                        </span>
                      </div>
                    </td>

                    {/* 商品名称 */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.productName || "未设置"}
                      </div>
                      {order.manufacturer && (
                        <div className="text-sm text-gray-500">
                          厂家: {order.manufacturer}
                        </div>
                      )}
                    </td>

                    {/* 收款额 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.amount ? formatCurrency(order.amount) : "¥0.00"}
                      </div>
                      {order.profit !== null && order.profit !== undefined && (
                        <div
                          className={`text-sm ${
                            order.profit >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          利润: {formatCurrency(order.profit)}
                        </div>
                      )}
                    </td>

                    {/* 退款类型 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.refundType || "-"}
                      </div>
                      {order.refundAmount && (
                        <div className="text-sm text-red-600">
                          退款: {formatCurrency(order.refundAmount)}
                        </div>
                      )}
                    </td>

                    {/* 退款原因 */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.refundReason || "-"}
                      </div>
                      {order.refundDate && (
                        <div className="text-sm text-gray-500">
                          退款日期: {formatDate(order.refundDate)}
                        </div>
                      )}
                    </td>

                    {/* 退回单号 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.returnTrackingNo || "-"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
