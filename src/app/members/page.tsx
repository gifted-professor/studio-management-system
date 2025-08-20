"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

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
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<
    MembersResponse["pagination"] | null
  >(null);
  const [isChangingPage, setIsChangingPage] = useState(false);
  const [sortBy, setSortBy] = useState<
    "lastOrderDate" | "totalOrders" | "totalAmount"
  >("totalOrders");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const fetchMembers = async (
    page = 1,
    searchQuery = "",
    sort = sortBy,
    order = sortOrder
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        search: searchQuery,
        sortBy: sort,
        sortOrder: order,
      });

      const response = await fetch(`/api/members?${params}`);
      if (!response.ok) throw new Error("获取会员列表失败");

      const data: MembersResponse = await response.json();
      setMembers(data.members);
      setPagination(data.pagination);
    } catch (error) {
      console.error("获取会员列表失败:", error);
      alert("获取会员列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage === currentPage || isChangingPage) return;

    setIsChangingPage(true);
    setCurrentPage(newPage);

    // 平滑滚动到顶部
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // 等待滚动动画完成后再加载数据
    setTimeout(() => {
      setIsChangingPage(false);
    }, 500);
  };

  useEffect(() => {
    fetchMembers(currentPage, search, sortBy, sortOrder);
  }, [currentPage, sortBy, sortOrder]);

  // 处理排序变化
  const handleSortChange = (
    newSortBy: "lastOrderDate" | "totalOrders" | "totalAmount"
  ) => {
    if (newSortBy === sortBy) {
      // 如果选择相同的排序字段，切换排序顺序
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      // 如果选择不同的排序字段，使用默认的降序
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
    setCurrentPage(1); // 重置到第一页
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMembers(1, search, sortBy, sortOrder);
  };

  const getStatusText = (status: string) => {
    return status === "ACTIVE" ? "活跃" : "非活跃";
  };

  const getStatusColor = (status: string) => {
    return status === "ACTIVE"
      ? "text-chart-2 bg-chart-2/10"
      : "text-muted-foreground bg-muted";
  };

  const getReturnRateLevel = (returnRate?: number) => {
    if (returnRate === undefined || returnRate === null) return "未知";
    if (returnRate < 30) return "低";
    if (returnRate < 60) return "中";
    return "高";
  };

  const getReturnRateColor = (returnRate?: number) => {
    if (returnRate === undefined || returnRate === null)
      return "text-muted-foreground bg-muted";
    if (returnRate < 30) return "text-green-700 bg-green-100 border-green-200";
    if (returnRate < 60) return "text-yellow-700 bg-yellow-100 border-yellow-200";
    return "text-red-700 bg-red-100 border-red-200";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">会员管理</h1>
            <p className="mt-2 text-muted-foreground">
              管理工作室会员信息和订单历史
            </p>
          </div>
          <Link
            href="/import"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            导入会员数据
          </Link>
        </div>

        {/* 搜索栏 */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索会员姓名或手机号..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg shadow-sm hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
            >
              搜索
            </button>
          </form>
        </div>

      {/* 排序选项 */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <span className="text-sm font-medium text-foreground">
              排序方式：
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSortChange("totalOrders")}
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === "totalOrders"
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                }`}
              >
                订单数量
                {sortBy === "totalOrders" && (
                  <span className="ml-1">
                    {sortOrder === "desc" ? "↓" : "↑"}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleSortChange("totalAmount")}
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === "totalAmount"
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                }`}
              >
                消费总额
                {sortBy === "totalAmount" && (
                  <span className="ml-1">
                    {sortOrder === "desc" ? "↓" : "↑"}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleSortChange("lastOrderDate")}
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === "lastOrderDate"
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                }`}
              >
                最后下单时间
                {sortBy === "lastOrderDate" && (
                  <span className="ml-1">
                    {sortOrder === "desc" ? "↓" : "↑"}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-500">
            点击相同排序项可切换升序/降序
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      {pagination && (
        <div className="mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      总会员数
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {pagination.total} 人
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 会员列表 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">加载中...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无会员</h3>
            <p className="mt-1 text-sm text-gray-500">
              通过导入Excel表格来添加会员数据。
            </p>
            <div className="mt-6">
              <Link
                href="/import"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                导入会员数据
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-200">
              {members.map((member) => (
                <li key={member.id}>
                  <Link
                    href={`/members/${member.id}`}
                    className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {member.name}
                            </p>
                            <span
                              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                member.status
                              )}`}
                            >
                              {getStatusText(member.status)}
                            </span>
                            <span
                              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReturnRateColor(
                                member.returnRate
                              )}`}
                            >
                              退货率: {getReturnRateLevel(member.returnRate)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {member.phone || "未设置手机号"}
                          </p>
                        </div>
                      </div>
                      <div className="hidden sm:flex sm:flex-col sm:items-end">
                        <p className="text-sm text-gray-900">
                          {member._count.orders} 个订单
                        </p>
                        <p className="text-sm text-gray-500">
                          消费总额: {formatCurrency(member.totalAmount)}
                        </p>
                        {member.lastOrderDate && (
                          <p className="text-xs text-gray-400">
                            最后下单: {formatDate(member.lastOrderDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {/* 分页 */}
            {pagination && pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1 || isChangingPage}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() =>
                      handlePageChange(
                        Math.min(pagination.pages, currentPage + 1)
                      )
                    }
                    disabled={
                      currentPage === pagination.pages || isChangingPage
                    }
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      显示第{" "}
                      <span className="font-medium">
                        {(currentPage - 1) * 20 + 1}
                      </span>{" "}
                      到{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * 20, pagination.total)}
                      </span>{" "}
                      条，共{" "}
                      <span className="font-medium">{pagination.total}</span>{" "}
                      条记录
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() =>
                          handlePageChange(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1 || isChangingPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        上一页
                      </button>
                      {/* 页码按钮 */}
                      {(() => {
                        const totalPages = pagination.pages;
                        const current = currentPage;
                        const delta = 2; // 当前页前后显示的页数

                        let startPage = Math.max(1, current - delta);
                        let endPage = Math.min(totalPages, current + delta);

                        // 如果开始页太靠后，向前补充
                        if (endPage - startPage < 4) {
                          startPage = Math.max(1, endPage - 4);
                        }

                        // 如果结束页太靠前，向后补充
                        if (endPage - startPage < 4) {
                          endPage = Math.min(totalPages, startPage + 4);
                        }

                        const pages = [];

                        // 第一页
                        if (startPage > 1) {
                          pages.push(
                            <button
                              key={1}
                              onClick={() => handlePageChange(1)}
                              disabled={isChangingPage}
                              className="relative inline-flex items-center px-4 py-2 border bg-white border-gray-300 text-gray-500 hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              1
                            </button>
                          );
                          if (startPage > 2) {
                            pages.push(
                              <span
                                key="start-ellipsis"
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                              >
                                ...
                              </span>
                            );
                          }
                        }

                        // 中间页码
                        for (let page = startPage; page <= endPage; page++) {
                          pages.push(
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              disabled={isChangingPage}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                                page === currentPage
                                  ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        }

                        // 最后一页
                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(
                              <span
                                key="end-ellipsis"
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                              >
                                ...
                              </span>
                            );
                          }
                          pages.push(
                            <button
                              key={totalPages}
                              onClick={() => handlePageChange(totalPages)}
                              disabled={isChangingPage}
                              className="relative inline-flex items-center px-4 py-2 border bg-white border-gray-300 text-gray-500 hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {totalPages}
                            </button>
                          );
                        }

                        return pages;
                      })()}
                      <button
                        onClick={() =>
                          handlePageChange(
                            Math.min(pagination.pages, currentPage + 1)
                          )
                        }
                        disabled={
                          currentPage === pagination.pages || isChangingPage
                        }
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        下一页
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}
