"use client";

import { useState, useEffect } from "react";
import {
  Lightbulb,
  TrendingUp,
  Users,
  AlertTriangle,
  Target,
  Gift,
  Star,
  RefreshCw,
  CheckCircle,
  Clock,
  Zap,
} from "lucide-react";

interface AISuggestion {
  id: string;
  title: string;
  content: string;
  type: 'product_recommendation' | 'promotion' | 'retention' | 'upselling';
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface MemberAnalysis {
  customerSegment: string;
  purchasePattern: string;
  riskLevel: string;
  potentialValue: string;
}

interface AISuggestionsProps {
  memberId: number;
}

export default function AISuggestions({ memberId }: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [analysis, setAnalysis] = useState<MemberAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [thinkingText, setThinkingText] = useState('');
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const thinkingSteps = [
    '📊 正在分析客户基本信息...',
    '🛍️ 正在分析客户购买历史和偏好...',
    '📈 正在评估客户价值和风险等级...',
    '🎯 正在识别客户行为模式...',
    '💡 正在生成个性化促单策略...',
    '✨ 正在优化建议方案...',
    '🎉 分析完成，正在整理结果...'
  ];

  // 加载已保存的建议
  useEffect(() => {
    const loadSavedSuggestions = async () => {
      try {
        setInitialLoading(true);
        const response = await fetch(`/api/members/${memberId}/ai-suggestions`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.hasSavedSuggestions) {
            setSuggestions(data.suggestions);
            setAnalysis(data.memberAnalysis);
            setGeneratedAt(data.generatedAt);
            setLastUpdated(data.lastUpdated);
            setHasGenerated(true);
          }
        }
      } catch (err) {
        console.error('加载已保存的AI建议失败:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    loadSavedSuggestions();
  }, [memberId]);

  // 格式化时间显示
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays <= 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // 检查建议是否过时（超过7天）
  const isOutdated = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays > 7;
  };

  const simulateThinking = () => {
    setThinkingStep(0);
    setThinkingText(thinkingSteps[0]);
    
    const interval = setInterval(() => {
      setThinkingStep((prevStep) => {
        const nextStep = prevStep + 1;
        if (nextStep < thinkingSteps.length) {
          setThinkingText(thinkingSteps[nextStep]);
          return nextStep;
        } else {
          clearInterval(interval);
          return prevStep;
        }
      });
    }, 800); // 每800ms切换一个步骤
    
    return interval;
  };

  const generateSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    // 开始思考过程模拟
    const thinkingInterval = simulateThinking();
    
    try {
      const response = await fetch(`/api/members/${memberId}/ai-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '生成建议失败');
      }

      const data = await response.json();
      setSuggestions(data.suggestions);
      setAnalysis(data.memberAnalysis);
      setGeneratedAt(new Date().toISOString());
      setLastUpdated(new Date().toISOString());
      setHasGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      clearInterval(thinkingInterval);
      setLoading(false);
      setThinkingStep(0);
      setThinkingText('');
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'product_recommendation':
        return <Target className="h-5 w-5" />;
      case 'promotion':
        return <Gift className="h-5 w-5" />;
      case 'retention':
        return <Users className="h-5 w-5" />;
      case 'upselling':
        return <TrendingUp className="h-5 w-5" />;
      case 'service_optimization':
        return <RefreshCw className="h-5 w-5" />;
      case 'loyalty_program':
        return <Star className="h-5 w-5" />;
      case 'tech_solution':
        return <Zap className="h-5 w-5" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getSuggestionTypeText = (type: string) => {
    switch (type) {
      case 'product_recommendation':
        return '商品推荐';
      case 'promotion':
        return '促销活动';
      case 'retention':
        return '客户保留';
      case 'upselling':
        return '追加销售';
      case 'service_optimization':
        return '服务优化';
      case 'loyalty_program':
        return '会员计划';
      case 'tech_solution':
        return '技术方案';
      default:
        return '其他建议';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Zap className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return '高优先级';
      case 'medium':
        return '中优先级';
      case 'low':
        return '低优先级';
      default:
        return '普通';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    if (riskLevel.includes('高') || riskLevel.includes('流失')) {
      return 'text-red-600 bg-red-100';
    } else if (riskLevel.includes('中') || riskLevel.includes('注意')) {
      return 'text-yellow-600 bg-yellow-100';
    } else {
      return 'text-green-600 bg-green-100';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Lightbulb className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">AI 促单建议</h2>
            {generatedAt && (
              <div className="ml-4 flex items-center">
                <Clock className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm text-gray-500">
                  生成于 {formatDateTime(generatedAt)}
                </span>
                {isOutdated(generatedAt) && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    建议更新
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={generateSuggestions}
            disabled={loading}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
              generatedAt && isOutdated(generatedAt)
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } disabled:bg-gray-400 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                {hasGenerated ? '重新生成' : '生成建议'}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  生成建议失败
                </h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">AI 正在分析中...</h3>
              <p className="text-blue-600 font-medium">{thinkingText}</p>
            </div>
            
            {/* 思考步骤进度 */}
            <div className="max-w-md mx-auto">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>分析进度</span>
                <span>{thinkingStep + 1}/{thinkingSteps.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${((thinkingStep + 1) / thinkingSteps.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* 思考步骤列表 */}
            <div className="mt-6 space-y-2">
              {thinkingSteps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center text-sm transition-all duration-300 ${
                    index <= thinkingStep
                      ? 'text-blue-600 font-medium'
                      : 'text-gray-400'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
                    index < thinkingStep
                      ? 'bg-green-100 text-green-600'
                      : index === thinkingStep
                      ? 'bg-blue-100 text-blue-600 animate-pulse'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {index < thinkingStep ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : index === thinkingStep ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                  </div>
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {initialLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-4"></div>
            <h3 className="text-sm font-medium text-gray-900">
              正在加载已保存的建议...
            </h3>
          </div>
        )}

        {!hasGenerated && !loading && !error && !initialLoading && (
          <div className="text-center py-8">
            <Lightbulb className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              点击生成 AI 促单建议
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              基于客户历史数据和购买行为，生成个性化的营销建议
            </p>
          </div>
        )}

        {analysis && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">客户分析</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-xs text-blue-600 font-medium">客户细分</div>
                <div className="text-sm text-blue-900">{analysis.customerSegment}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-xs text-purple-600 font-medium">购买模式</div>
                <div className="text-sm text-purple-900">{analysis.purchasePattern}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 font-medium">流失风险</div>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(analysis.riskLevel)}`}>
                  {analysis.riskLevel}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-xs text-green-600 font-medium">潜在价值</div>
                <div className="text-sm text-green-900">{analysis.potentialValue}</div>
              </div>
            </div>
          </div>
        )}

        {suggestions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">AI 建议方案</h3>
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`border rounded-lg p-4 ${getPriorityColor(suggestion.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getSuggestionIcon(suggestion.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {suggestion.title}
                          </h4>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getSuggestionTypeText(suggestion.type)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          {suggestion.content}
                        </p>
                        <div className="bg-white bg-opacity-50 rounded-md p-3">
                          <p className="text-xs text-gray-600">
                            <strong>支撑理由：</strong>{suggestion.reasoning}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-4">
                      {getPriorityIcon(suggestion.priority)}
                      <span className="text-xs text-gray-500">
                        {getPriorityText(suggestion.priority)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}