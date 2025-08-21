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
  Filter,
  ArrowUpDown,
  Star,
  AlertTriangle
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
  const [sortBy, setSortBy] = useState<"lastOrderDate" | "totalOrders" | "totalAmount">("totalOrders");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [activityFilter, setActivityFilter] = useState<ActivityLevel | "">("");
  const [platformFilter, setPlatformFilter] = useState<string>("");
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchMembers = async (
    page = 1,
    searchQuery = searchTerm,
    sort = sortBy,
    order = sortOrder,
    activity = activityFilter,
    platform = platformFilter,
    append = false
  ) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        search: searchQuery,
        sortBy: sort,
        sortOrder: order,
      });

      if (activity) params.set("activityLevel", activity);
      if (platform) params.set("platform", platform);

      const response = await fetch(`/api/members?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }

      const data: MembersResponse = await response.json();

      if (append) {
        setMembers((prev) => [...prev, ...data.members]);
      } else {
        setMembers(data.members);
      }

      setTotalCount(data.pagination.total);
      setHasMore(page < data.pagination.pages);

      if (data.platforms) {
        setAvailablePlatforms(data.platforms);
      }
    } catch (error) {
      console.error("获取会员列表失败:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (hasMore && !loadingMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      await fetchMembers(nextPage, searchTerm, sortBy, sortOrder, activityFilter, platformFilter, true);
    }
  }, [currentPage, hasMore, loadingMore, searchTerm, sortBy, sortOrder, activityFilter, platformFilter]);

  const resetAndFetch = useCallback(async () => {
    setCurrentPage(1);
    setMembers([]);
    setHasMore(true);
    await fetchMembers(1, searchTerm, sortBy, sortOrder, activityFilter, platformFilter, false);
  }, [searchTerm, sortBy, sortOrder, activityFilter, platformFilter]);

  useEffect(() => {
    resetAndFetch();
  }, [resetAndFetch]);

  const handleSortChange = (newSortBy: "lastOrderDate" | "totalOrders" | "totalAmount") => {
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

  // 无限滚动
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

  const calculateDaysSinceLastOrder = (lastOrderDate?: string) => {
    if (!lastOrderDate) return null;
    const now = new Date();
    const orderDate = new Date(lastOrderDate);
    const diffTime = Math.abs(now.getTime() - orderDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDaysSinceOrderText = (days?: number | null) => {
    if (!days) return "未下单";
    if (days === 1) return "昨天";
    if (days <= 7) return `${days}天前`;
    if (days <= 30) return `${days}天前`;
    if (days <= 90) return `${days}天前`;
    return `${days}天前`;
  };

  const getActivityIcon = (level: ActivityLevel) => {
    const icons = {
      HIGHLY_ACTIVE: <Star className="h-4 w-4 text-yellow-500" />,
      ACTIVE: <TrendingUp className="h-4 w-4 text-green-500" />,
      SLIGHTLY_INACTIVE: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
      MODERATELY_INACTIVE: <TrendingDown className="h-4 w-4 text-orange-500" />,
      HEAVILY_INACTIVE: <AlertTriangle className="h-4 w-4 text-red-500" />,
      DEEPLY_INACTIVE: <Clock className="h-4 w-4 text-gray-400" />
    };
    return icons[level] || <Clock className="h-4 w-4 text-gray-400" />;
  };

  const getStatusBadge = (level: ActivityLevel, returnRate?: number) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border";
    
    if (returnRate && returnRate > 20) {
      return `${baseClasses} bg-destructive/10 text-destructive border-destructive/20`;
    }
    
    switch (level) {
      case 'HIGHLY_ACTIVE':
        return `${baseClasses} bg-yellow-50 text-yellow-700 border-yellow-200`;
      case 'ACTIVE':
        return `${baseClasses} bg-green-50 text-green-700 border-green-200`;
      case 'SLIGHTLY_INACTIVE':
        return `${baseClasses} bg-orange-50 text-orange-700 border-orange-200`;
      case 'MODERATELY_INACTIVE':
        return `${baseClasses} bg-orange-50 text-orange-700 border-orange-200`;
      case 'HEAVILY_INACTIVE':
        return `${baseClasses} bg-red-50 text-red-700 border-red-200`;
      case 'DEEPLY_INACTIVE':
        return `${baseClasses} bg-gray-50 text-gray-700 border-gray-200`;
      default:
        return `${baseClasses} bg-gray-50 text-gray-700 border-gray-200`;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题卡片 */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              会员管理
            </h1>
            <p className="text-muted-foreground">
              管理客户信息，跟踪订单记录和活跃度
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm text-muted-foreground">
              <div>总会员 <span className="font-semibold text-foreground">{totalCount}</span> 人</div>
              <div>已显示 <span className="font-semibold text-foreground">{members.length}</span> 人</div>
            </div>
            <Link
              href="/import"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 px-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Plus className="h-5 w-5" />
              导入数据
            </Link>
          </div>
        </div>
      </div>

      {/* 搜索和筛选卡片 */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        {/* 搜索栏 */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 border border-border rounded-xl text-sm placeholder-muted-foreground bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                placeholder="搜索会员姓名或手机号..."
              />
            </div>
            <button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-6 rounded-xl transition-colors duration-200 flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              搜索
            </button>
          </div>
        </form>

        {/* 筛选和排序 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 活跃度筛选 */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              活跃度筛选
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActivityFilter("")}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
                  activityFilter === ""
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-foreground border-border hover:bg-muted/50"
                }`}
              >
                全部会员
              </button>
              {(['ACTIVE', 'SLIGHTLY_INACTIVE', 'HEAVILY_INACTIVE'] as ActivityLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setActivityFilter(level)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
                    activityFilter === level
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-foreground border-border hover:bg-muted/50"
                  }`}
                >
                  {ACTIVITY_LABELS[level]}
                </button>
              ))}
            </div>
          </div>

          {/* 平台筛选 */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              出售平台
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setPlatformFilter("")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  platformFilter === ""
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-background text-foreground border-border hover:bg-muted/50"
                }`}
              >
                全部
              </button>
              {availablePlatforms.map((platform) => (
                <button
                  key={platform}
                  onClick={() => setPlatformFilter(platform)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    platformFilter === platform
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-background text-foreground border-border hover:bg-muted/50"
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* 排序选项 */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-primary" />
              排序方式
            </label>
            <div className="space-y-2">
              {([
                { key: 'totalOrders' as const, label: '订单数量' },
                { key: 'totalAmount' as const, label: '消费金额' },
                { key: 'lastOrderDate' as const, label: '最后下单' }
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleSortChange(key)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border flex items-center justify-between ${
                    sortBy === key
                      ? "bg-secondary text-secondary-foreground border-secondary shadow-sm"
                      : "bg-background text-foreground border-border hover:bg-muted/50"
                  }`}
                >
                  <span>{label}</span>
                  {sortBy === key && (
                    <span className="text-sm">
                      {sortOrder === "desc" ? "↓" : "↑"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 会员列表 - 现代卡片式设计 */}
      <div>
        {loading && members.length === 0 ? (
          <div className="bg-card rounded-xl shadow-sm border border-border p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <RefreshCw className="animate-spin h-12 w-12 text-primary" />
                <div className="absolute inset-0 bg-primary/20 rounded-full opacity-20 animate-ping"></div>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">加载中...</h3>
              <p className="text-muted-foreground">正在获取会员数据</p>
            </div>
          </div>
        ) : members.length === 0 ? (
          <div className="bg-card rounded-xl shadow-sm border border-border p-12">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                <Users className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">没有找到会员</h3>
              <p className="text-muted-foreground mb-8">
                通过导入Excel表格来添加会员数据，开始管理您的客户关系。
              </p>
              <Link
                href="/import"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 px-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Plus className="h-5 w-5" />
                导入会员数据
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((member) => {
              const daysSinceLastOrder = calculateDaysSinceLastOrder(member.lastOrderDate);
              
              return (
                <div
                  key={member.id}
                  className="bg-card rounded-xl shadow-sm border border-border hover:shadow-md hover:border-primary/30 transition-all duration-300 group"
                >
                  <Link href={`/members/${member.id}`} className="block p-6">
                    <div className="flex items-center justify-between">
                      {/* 左侧：会员信息 */}
                      <div className="flex items-center space-x-4">
                        {/* 头像 */}
                        <div className="relative">
                          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shadow-sm border border-border/50 group-hover:shadow-md transition-all duration-300">
                            <span className="text-lg font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors duration-300">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card border-2 border-border shadow-sm flex items-center justify-center">
                            {getActivityIcon(member.activityLevel)}
                          </div>
                        </div>

                        {/* 会员详细信息 */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                              {member.name}
                            </h3>
                            <span className={getStatusBadge(member.activityLevel, member.returnRate)}>
                              {ACTIVITY_LABELS[member.activityLevel]}
                            </span>
                          </div>

                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {member.phone || "未设置手机号"}
                            </span>
                            {member.address && (
                              <span className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {member.address.length > 30
                                  ? member.address.substring(0, 30) + "..."
                                  : member.address}
                              </span>
                            )}
                            <span className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              加入 {formatDate(member.createdAt).split(' ')[0]}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 右侧：关键数据展示 */}
                      <div className="hidden lg:flex lg:items-center lg:space-x-8">
                        {/* 订单数量 */}
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {member.totalOrders}
                          </div>
                          <div className="text-xs text-muted-foreground font-medium">
                            订单数
                          </div>
                        </div>

                        {/* 消费金额 */}
                        <div className="text-center">
                          <div className="text-xl font-bold text-chart-1">
                            {formatCurrency(member.totalAmount)}
                          </div>
                          <div className="text-xs text-muted-foreground font-medium">
                            消费总额
                          </div>
                        </div>

                        {/* 退货率 */}
                        <div className="text-center">
                          <div className={`text-lg font-bold ${
                            !member.returnRate || member.returnRate < 10
                              ? "text-chart-1"
                              : member.returnRate < 20
                              ? "text-chart-2"
                              : "text-destructive"
                          }`}>
                            {member.returnRate ? `${member.returnRate.toFixed(1)}%` : '0%'}
                          </div>
                          <div className="text-xs text-muted-foreground font-medium">
                            退货率
                          </div>
                        </div>

                        {/* 最后下单时间 */}
                        <div className="text-center">
                          <div className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold border-2 ${
                            !daysSinceLastOrder 
                              ? 'bg-muted/50 text-muted-foreground border-muted'
                              : daysSinceLastOrder <= 7 
                                ? 'bg-chart-1/10 text-chart-1 border-chart-1/30'
                                : daysSinceLastOrder <= 30 
                                  ? 'bg-chart-2/10 text-chart-2 border-chart-2/30'
                                  : daysSinceLastOrder <= 90 
                                    ? 'bg-chart-3/10 text-chart-3 border-chart-3/30'
                                    : 'bg-destructive/10 text-destructive border-destructive/30'
                          } shadow-sm`}>
                            <Clock className="h-4 w-4 mr-1" />
                            {getDaysSinceOrderText(daysSinceLastOrder)}
                          </div>
                        </div>
                      </div>

                      {/* 移动端简化显示 */}
                      <div className="lg:hidden flex flex-col items-end space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-primary">
                            {member.totalOrders}单
                          </span>
                          <span className="text-sm font-semibold text-chart-1">
                            {formatCurrency(member.totalAmount)}
                          </span>
                        </div>
                        <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${
                          !daysSinceLastOrder 
                            ? 'bg-muted/50 text-muted-foreground'
                            : daysSinceLastOrder <= 7 
                              ? 'bg-chart-1/10 text-chart-1'
                              : daysSinceLastOrder <= 30 
                                ? 'bg-chart-2/10 text-chart-2'
                                : 'bg-destructive/10 text-destructive'
                        }`}>
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
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 mt-4">
            <div className="flex justify-center items-center">
              <div className="relative">
                <RefreshCw className="animate-spin h-8 w-8 text-primary" />
                <div className="absolute inset-0 bg-primary/20 rounded-full opacity-20 animate-ping"></div>
              </div>
              <span className="ml-3 text-lg font-medium text-foreground">
                加载更多会员...
              </span>
            </div>
          </div>
        )}

        {/* 统计信息卡片 */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl shadow-lg text-primary-foreground p-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary-foreground/20 rounded-full p-3">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">会员统计</h3>
                <p className="text-primary-foreground/80">
                  已显示 {members.length} 人，共 {totalCount} 人
                </p>
              </div>
            </div>
            <div className="text-right">
              {hasMore && !loadingMore ? (
                <div className="bg-primary-foreground/20 rounded-lg px-4 py-2">
                  <p className="text-sm font-medium">↓ 滚动加载更多</p>
                </div>
              ) : !hasMore && members.length > 0 ? (
                <div className="bg-chart-1/80 rounded-lg px-4 py-2">
                  <p className="text-sm font-medium">✓ 已显示全部</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}