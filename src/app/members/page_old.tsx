"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Users, 
  RefreshCw, 
  Clock,
  Calendar,
  Phone,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  ArrowUpDown
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ActivityLevel,
  ACTIVITY_LABELS,
  getActivityLevelColor,
} from "@/lib/activity";

interface Member {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  status: string;
  activityLevel: ActivityLevel;
  totalOrders: number;
  totalAmount: number;
  lastOrderDate?: string;
  returnRate?: number;
  createdAt: string;
  _count: {
    orders: number;
  };
}

interface MembersResponse {
  members: Member[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  platforms?: string[];
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<
    "lastOrderDate" | "totalOrders" | "totalAmount"
  >("totalOrders");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [activityFilter, setActivityFilter] = useState<ActivityLevel | "">("");
  const [daysSinceOrderFilter, setDaysSinceOrderFilter] = useState<
    "active" | "recent" | "promotion" | "care" | ""
  >("");
  const [platformFilter, setPlatformFilter] = useState<string>("");
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);
  const [updatingActivity, setUpdatingActivity] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // 实际应用的搜索词

  const fetchMembers = async (
    page = 1,
    searchQuery = searchTerm,
    sort = sortBy,
    order = sortOrder,
    activity = activityFilter,
    daysFilter = daysSinceOrderFilter,
    platform = platformFilter,
    append = false
  ) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      console.log("开始获取会员列表...", { page, append });

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20", // 无限滚动可以增加每页数量
        search: searchQuery,
        sortBy: sort,
        sortOrder: order,
      });

      if (activity) {
        params.set("activityLevel", activity);
      }

      if (daysFilter) {
        params.set("daysSinceOrder", daysFilter);
      }

      if (platform) {
        params.set("platform", platform);
      }

      const url = `/api/members?${params}`;
      console.log("请求URL:", url);

      const response = await fetch(url);
      console.log("响应状态:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`获取会员列表失败: ${response.status} ${errorText}`);
      }

      const data: MembersResponse = await response.json();
      console.log("获取到会员数据:", data.members?.length, "个", {
        total: data.pagination.total,
      });

      if (append) {
        // 追加数据
        setMembers((prev) => [...prev, ...data.members]);
      } else {
        // 替换数据
        setMembers(data.members);
      }

      setTotalCount(data.pagination.total);
      setHasMore(page < data.pagination.pages);

      // 更新可用平台列表
      if (data.platforms) {
        setAvailablePlatforms(data.platforms);
      }
    } catch (error) {
      console.error("获取会员列表失败:", error);
      alert(`获取会员列表失败: ${error}`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 无限滚动加载更多数据
  const loadMore = useCallback(async () => {
    if (hasMore && !loadingMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      await fetchMembers(
        nextPage,
        searchTerm,
        sortBy,
        sortOrder,
        activityFilter,
        daysSinceOrderFilter,
        platformFilter,
        true
      );
    }
  }, [
    currentPage,
    hasMore,
    loadingMore,
    searchTerm,
    sortBy,
    sortOrder,
    activityFilter,
    daysSinceOrderFilter,
  ]);

  // 重置数据并重新加载
  const resetAndFetch = useCallback(async () => {
    setCurrentPage(1);
    setMembers([]);
    setHasMore(true);
    await fetchMembers(
      1,
      searchTerm,
      sortBy,
      sortOrder,
      activityFilter,
      daysSinceOrderFilter,
      platformFilter,
      false
    );
  }, [
    searchTerm,
    sortBy,
    sortOrder,
    activityFilter,
    daysSinceOrderFilter,
    platformFilter,
  ]);

  // 初始加载和筛选/排序变化时重新加载
  useEffect(() => {
    resetAndFetch();
  }, [resetAndFetch]);

  // 处理排序变化
  const handleSortChange = (
    newSortBy: "lastOrderDate" | "totalOrders" | "totalAmount"
  ) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(search);
  };

  // 简单的无限滚动实现
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop !==
          document.documentElement.offsetHeight ||
        loading ||
        loadingMore ||
        !hasMore
      ) {
        return;
      }
      loadMore();
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMore, loading, loadingMore, hasMore]);

  // 实用函数
  const getReturnRateColor = (rate?: number) => {
    if (!rate) return "bg-green-100 text-green-800 border-green-200";
    if (rate < 10) return "bg-green-100 text-green-800 border-green-200";
    if (rate < 20) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getReturnRateLevel = (rate?: number) => {
    if (!rate) return "0%";
    return `${rate.toFixed(1)}%`;
  };

  const calculateDaysSinceLastOrder = (lastOrderDate?: string) => {
    if (!lastOrderDate) return null;
    const now = new Date();
    const orderDate = new Date(lastOrderDate);
    const diffTime = Math.abs(now.getTime() - orderDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDaysSinceOrderColor = (days?: number | null) => {
    if (!days) return "bg-gray-100 text-gray-600 border-gray-300";
    if (days <= 7) return "bg-green-100 text-green-700 border-green-200";
    if (days <= 30) return "bg-blue-100 text-blue-700 border-blue-200";
    if (days <= 90) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const getDaysSinceOrderText = (days?: number | null) => {
    if (!days) return "未下单";
    if (days === 1) return "昨天";
    if (days <= 7) return `${days}天前`;
    if (days <= 30) return `${days}天前`;
    if (days <= 90) return `${days}天前`;
    return `${days}天前`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 主面板 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          {/* 页面头部信息 */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Users className="h-6 w-6 text-blue-600" />
                  会员管理
                </h1>
                {/* <p className="mt-1 text-sm text-gray-600">
                  📊 客户信息管理 • 📈 订单记录跟踪 • 🎯 活跃度智能分析
                </p> */}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  总会员 {totalCount} 人
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  已显示 {members.length} 人
                </span>
              </div>
            </div>
            <Link
              href="/import"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              导入数据
            </Link>
          </div>

          {/* 搜索栏 */}
          <div className="mb-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl text-sm placeholder-gray-500 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  placeholder="🔍 搜索会员姓名或手机号..."
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200 flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                搜索
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 活跃度筛选 */}
            <div>
              <label className="text-sm font-semibold text-gray-800 mb-3 block flex items-center gap-2">
                <span className="text-green-600">📊</span>
                活跃度筛选
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActivityFilter("")}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                    activityFilter === ""
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                      : "bg-slate-50 text-gray-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  🎯 全部会员
                </button>
                <button
                  onClick={() => setActivityFilter("ACTIVE")}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                    activityFilter === "ACTIVE"
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                      : "bg-slate-50 text-gray-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                  title="50天内有下单"
                >
                  ✅ 活跃
                </button>
                <button
                  onClick={() => setActivityFilter("SLIGHTLY_INACTIVE")}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                    activityFilter === "SLIGHTLY_INACTIVE"
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                      : "bg-slate-50 text-gray-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                  title="50-90天前下单"
                >
                  ⚠️ 轻度流失
                </button>
                <button
                  onClick={() => setActivityFilter("HEAVILY_INACTIVE")}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                    activityFilter === "HEAVILY_INACTIVE"
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                      : "bg-slate-50 text-gray-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                  title="90天以上未下单"
                >
                  🚨 重度流失
                </button>
              </div>
            </div>

            {/* 出售平台筛选 */}
            <div>
              <label className="text-sm font-semibold text-gray-800 mb-3 block">
                🛍️ 出售平台
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPlatformFilter("")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    platformFilter === ""
                      ? "bg-purple-100 text-purple-800 border border-purple-200"
                      : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  全部
                </button>
                {availablePlatforms.map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setPlatformFilter(platform)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      platformFilter === platform
                        ? "bg-purple-100 text-purple-800 border border-purple-200"
                        : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                    }`}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>

            {/* 排序选项 */}
            <div>
              <label className="text-sm font-semibold text-gray-800 mb-3 block flex items-center gap-2">
                <span className="text-orange-600">📈</span>
                排序方式
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => handleSortChange("totalOrders")}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border-2 flex items-center justify-between ${
                    sortBy === "totalOrders"
                      ? "bg-orange-600 text-white border-orange-600 shadow-lg"
                      : "bg-slate-50 text-gray-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>📊</span>
                    订单数量
                  </span>
                  {sortBy === "totalOrders" && (
                    <span className="text-lg">
                      {sortOrder === "desc" ? "↓" : "↑"}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleSortChange("totalAmount")}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border-2 flex items-center justify-between ${
                    sortBy === "totalAmount"
                      ? "bg-orange-600 text-white border-orange-600 shadow-lg"
                      : "bg-slate-50 text-gray-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>💰</span>
                    消费金额
                  </span>
                  {sortBy === "totalAmount" && (
                    <span className="text-lg">
                      {sortOrder === "desc" ? "↓" : "↑"}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleSortChange("lastOrderDate")}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border-2 flex items-center justify-between ${
                    sortBy === "lastOrderDate"
                      ? "bg-orange-600 text-white border-orange-600 shadow-lg"
                      : "bg-slate-50 text-gray-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>⏰</span>
                    最后下单
                  </span>
                  {sortBy === "lastOrderDate" && (
                    <span className="text-lg">
                      {sortOrder === "desc" ? "↓" : "↑"}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 会员列表 */}
        <div>
          {loading && members.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="relative">
                  <RefreshCw className="animate-spin h-12 w-12 text-blue-600" />
                  <div className="absolute inset-0 bg-blue-100 rounded-full opacity-20 animate-ping"></div>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  加载中...
                </h3>
                <p className="text-gray-600">正在获取会员数据</p>
              </div>
            </div>
          ) : members.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12">
              <div className="text-center">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  没有找到会员
                </h3>
                <p className="text-gray-600 mb-8">
                  通过导入Excel表格来添加会员数据，开始管理您的客户关系。
                </p>
                <Link
                  href="/import"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <Plus className="h-5 w-5" />
                  导入会员数据
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member, index) => {
                const daysSinceLastOrder = calculateDaysSinceLastOrder(
                  member.lastOrderDate
                );
                const activityIcons = {
                  HIGHLY_ACTIVE: "🔥",
                  ACTIVE: "✅",
                  SLIGHTLY_INACTIVE: "⚠️",
                  MODERATELY_INACTIVE: "📉",
                  HEAVILY_INACTIVE: "🚨",
                  DEEPLY_INACTIVE: "💤",
                };

                return (
                  <div
                    key={member.id}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group"
                  >
                    <Link href={`/members/${member.id}`} className="block p-6">
                      <div className="flex items-center justify-between">
                        {/* 左侧信息 */}
                        <div className="flex items-center space-x-4">
                          {/* 头像 */}
                          <div className="relative">
                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                              <span className="text-lg font-bold text-white">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center">
                              <span className="text-xs">
                                {activityIcons[
                                  member.activityLevel as keyof typeof activityIcons
                                ] || "📊"}
                              </span>
                            </div>
                          </div>

                          {/* 会员信息 */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {member.name}
                              </h3>
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getActivityLevelColor(
                                  member.activityLevel
                                )} shadow-sm`}
                              >
                                {ACTIVITY_LABELS[member.activityLevel]}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <span>📞</span>
                                {member.phone || "未设置手机号"}
                              </span>
                              {member.address && (
                                <span className="flex items-center gap-1">
                                  <span>📍</span>
                                  {member.address.length > 20
                                    ? member.address.substring(0, 20) + "..."
                                    : member.address}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 右侧统计数据 */}
                        <div className="hidden lg:flex lg:items-center lg:space-x-8">
                          {/* 订单数量 */}
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {member.totalOrders}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                              订单数
                            </div>
                          </div>

                          {/* 消费金额 */}
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(member.totalAmount)}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                              消费总额
                            </div>
                          </div>

                          {/* 退货率 */}
                          <div className="text-center">
                            <div
                              className={`text-lg font-bold ${
                                !member.returnRate || member.returnRate < 10
                                  ? "text-green-600"
                                  : member.returnRate < 20
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {getReturnRateLevel(member.returnRate)}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                              退货率
                            </div>
                          </div>

                          {/* 最后下单 */}
                          <div className="text-center">
                            <div
                              className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold border-2 ${getDaysSinceOrderColor(
                                daysSinceLastOrder
                              )} shadow-sm`}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              {getDaysSinceOrderText(daysSinceLastOrder)}
                            </div>
                          </div>
                        </div>

                        {/* 移动端简化显示 */}
                        <div className="lg:hidden flex flex-col items-end space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-blue-600">
                              {member.totalOrders}单
                            </span>
                            <span className="text-sm font-semibold text-green-600">
                              {formatCurrency(member.totalAmount)}
                            </span>
                          </div>
                          <div
                            className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${getDaysSinceOrderColor(
                              daysSinceLastOrder
                            )}`}
                          >
                            {getDaysSinceOrderText(daysSinceLastOrder)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {/* 加载更多指示器 */}
          {loadingMore && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-4">
              <div className="flex justify-center items-center">
                <div className="relative">
                  <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
                  <div className="absolute inset-0 bg-blue-100 rounded-full opacity-20 animate-ping"></div>
                </div>
                <span className="ml-3 text-lg font-medium text-gray-700">
                  加载更多会员...
                </span>
              </div>
            </div>
          )}

          {/* 统计信息面板 */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg text-white p-6 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">会员统计</h3>
                  <p className="text-blue-100">
                    已显示 {members.length} 人，共 {totalCount} 人
                  </p>
                </div>
              </div>
              <div className="text-right">
                {hasMore && !loadingMore ? (
                  <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                    <p className="text-sm font-medium">↓ 滚动加载更多</p>
                  </div>
                ) : !hasMore && members.length > 0 ? (
                  <div className="bg-green-500 bg-opacity-80 rounded-lg px-4 py-2">
                    <p className="text-sm font-medium">✓ 已显示全部</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
