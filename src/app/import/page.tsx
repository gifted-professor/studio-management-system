'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Home, X, Eye, EyeOff } from 'lucide-react'

interface ImportResult {
  success: boolean
  message: string
  data?: {
    newMembers: number
    newOrders: number
    duplicateMembers: number
    duplicateOrders: number
    totalProcessed: number
  }
}

export default function ImportPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [countdown, setCountdown] = useState(5)
  
  // 进度条相关状态
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [progressStage, setProgressStage] = useState('')
  const [logs, setLogs] = useState<{timestamp: string, message: string, type: string}[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const [logsExpanded, setLogsExpanded] = useState(true)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // 倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (showSuccessModal && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
    } else if (showSuccessModal && countdown === 0) {
      // 倒计时结束，自动跳转到主页
      router.push('/')
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [showSuccessModal, countdown, router])

  // 自动滚动到日志底部
  useEffect(() => {
    if (logsEndRef.current && showLogs && logsExpanded) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, showLogs, logsExpanded])

  // 处理成功弹窗的关闭
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    setCountdown(5) // 重置倒计时
  }

  // 手动跳转到主页
  const handleGoToHome = () => {
    router.push('/')
  }

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        selectedFile.type === 'application/vnd.ms-excel' ||
        selectedFile.name.endsWith('.xlsx') ||
        selectedFile.name.endsWith('.xls')) {
      setFile(selectedFile)
      setResult(null)
    } else {
      alert('请选择Excel文件 (.xlsx 或 .xls)')
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  // 模拟进度更新
  const simulateProgress = () => {
    return new Promise<void>((resolve) => {
      const stages = [
        { progress: 10, text: '正在上传文件...', stage: '文件上传' },
        { progress: 25, text: '正在解析Excel文件...', stage: '文件解析' },
        { progress: 40, text: '正在验证数据格式...', stage: '数据验证' },
        { progress: 55, text: '正在处理会员信息...', stage: '会员处理' },
        { progress: 70, text: '正在导入订单数据...', stage: '订单导入' },
        { progress: 85, text: '正在计算统计信息...', stage: '数据统计' },
        { progress: 95, text: '正在完成最后处理...', stage: '收尾工作' }
      ]
      
      let currentStage = 0
      const updateProgress = () => {
        if (currentStage < stages.length) {
          const stage = stages[currentStage]
          setProgress(stage.progress)
          setProgressText(stage.text)
          setProgressStage(stage.stage)
          currentStage++
          
          // 根据文件大小动态调整间隔时间
          const fileSize = file?.size || 0
          const baseInterval = 800 // 基础间隔
          const sizeMultiplier = Math.min(fileSize / (1024 * 1024), 5) // 最大5倍
          const interval = baseInterval + (sizeMultiplier * 200)
          
          setTimeout(updateProgress, interval)
        } else {
          resolve()
        }
      }
      
      updateProgress()
    })
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setResult(null)
    setProgress(0)
    setProgressText('开始处理...')
    setProgressStage('初始化')
    setLogs([])
    setShowLogs(true)

    let importResult: ImportResult | null = null
    
    try {
      // 开始进度模拟
      const progressPromise = simulateProgress()
      
      // 启动流式导入获取实时日志
      const streamPromise = new Promise<ImportResult | null>((resolve, reject) => {
        const formData = new FormData()
        formData.append('file', file)

        fetch('/api/import/stream', {
          method: 'POST',
          body: formData,
        }).then(response => {
          if (!response.body) {
            reject(new Error('No response body'))
            return
          }

          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let finalResult: ImportResult | null = null

          const readStream = () => {
            reader.read().then(({ done, value }) => {
              if (done) {
                resolve(finalResult)
                return
              }

              const chunk = decoder.decode(value, { stream: true })
              const lines = chunk.split('\n')
              
              lines.forEach(line => {
                if (line.startsWith('data: ')) {
                  try {
                    const logEntry = JSON.parse(line.slice(6))
                    
                    // 检查是否是最终结果
                    if (logEntry.message.startsWith('FINAL_RESULT:')) {
                      const resultData = logEntry.message.replace('FINAL_RESULT:', '')
                      finalResult = JSON.parse(resultData)
                    } else {
                      setLogs(prevLogs => [...prevLogs, logEntry])
                    }
                  } catch (error) {
                    console.error('解析SSE数据失败:', error, line)
                  }
                }
              })

              readStream()
            }).catch(error => {
              console.error('读取流失败:', error)
              reject(error)
            })
          }

          readStream()
        }).catch(error => {
          console.error('启动流失败:', error)
          reject(error)
        })
      })
      
      // 等待进度模拟和流式导入完成
      const [_, streamResult] = await Promise.all([progressPromise, streamPromise])
      
      importResult = streamResult || {
        success: false,
        message: '导入失败：未收到结果',
        data: {
          newMembers: 0,
          newOrders: 0,
          duplicateMembers: 0,
          duplicateOrders: 0,
          totalProcessed: 0
        }
      }
      
      // 根据结果设置最终进度状态
      if (importResult?.success) {
        setProgress(100)
        setProgressText('数据导入成功！')
        setProgressStage('完成')
      } else {
        setProgress(0)
        setProgressText('导入失败，请检查文件格式')
        setProgressStage('错误')
      }
      
      setResult(importResult)
      
      if (importResult?.success) {
        setFile(null)
        
        // 2秒后显示成功弹窗
        setTimeout(() => {
          setShowSuccessModal(true)
          setCountdown(5) // 重置倒计时
        }, 2000)
      }
    } catch (error) {
      console.error('上传失败:', error)
      setProgress(0)
      setProgressText('网络错误，请稍后重试')
      setProgressStage('错误')
      setResult({
        success: false,
        message: '网络连接失败，请检查网络状态后重试'
      })
    } finally {
      setTimeout(() => {
        setUploading(false)
        if (!importResult || !importResult.success) {
          setProgress(0)
          setProgressText('')
          setProgressStage('')
        }
      }, importResult?.success ? 2000 : 5000) // 成功时2秒后清除，失败时5秒后清除
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">数据导入</h1>
        <p className="mt-1 text-sm text-gray-600">
          上传Excel文件导入会员和订单数据，系统会自动进行去重处理
        </p>
        
        {/* 返回主页按钮 */}
        <div className="mt-4">
          <a
            href="/"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
          >
            ← 返回主页
          </a>
        </div>
      </div>

      {/* 文件上传区域 */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">上传Excel文件</h2>
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          
          {file ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">
                文件大小: {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                onClick={() => setFile(null)}
                className="text-sm text-red-600 hover:text-red-500"
              >
                移除文件
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                拖拽Excel文件到此处，或者
              </p>
              <label className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-500 font-medium">
                  点击选择文件
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0])
                    }
                  }}
                />
              </label>
            </div>
          )}
        </div>

        {/* 文件格式说明 */}
        <div className="mt-4 text-xs text-gray-500">
          <p className="font-medium mb-2">支持的文件格式：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Excel文件 (.xlsx, .xls)</li>
            <li>必须包含列：<span className="font-medium">姓名</span></li>
            <li>可选列：手机号、地址、商品名称、收款额、成本价、单号、出售平台、负责人、厂家、尺码、颜色等</li>
            <li>系统会自动识别中文列名并进行数据映射</li>
          </ul>
        </div>

        {/* 上传按钮 */}
        <div className="mt-6">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              !file || uploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                处理中...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                开始导入
              </>
            )}
          </button>
        </div>
      </div>

      {/* 进度条 */}
      {uploading && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-gray-900">正在处理数据</h3>
              <span className="text-sm font-medium text-blue-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
                  progressStage === '错误' 
                    ? 'bg-gradient-to-r from-red-500 to-red-600' 
                    : progress === 100 
                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600'
                }`}
                style={{ width: progressStage === '错误' ? '100%' : `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                {progressStage === '错误' ? (
                  <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                ) : progress === 100 ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                ) : (
                  <Loader2 className="animate-spin h-4 w-4 mr-2 text-blue-600" />
                )}
                <span className={`${
                  progressStage === '错误' ? 'text-red-600' : 
                  progress === 100 ? 'text-green-600' : 'text-gray-600'
                }`}>{progressText}</span>
              </div>
              <span className={`${
                progressStage === '错误' ? 'text-red-500' : 
                progress === 100 ? 'text-green-500' : 'text-gray-500'
              }`}>当前阶段: {progressStage}</span>
            </div>
          </div>
          
          {/* 处理步骤指示器 */}
          <div className="grid grid-cols-7 gap-2 mt-6">
            {[
              { name: '文件上传', threshold: 10 },
              { name: '文件解析', threshold: 25 },
              { name: '数据验证', threshold: 40 },
              { name: '会员处理', threshold: 55 },
              { name: '订单导入', threshold: 70 },
              { name: '数据统计', threshold: 85 },
              { name: '收尾工作', threshold: 95 }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div 
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium mb-2 transition-colors duration-300 ${
                    progress >= step.threshold 
                      ? 'bg-green-500 text-white' 
                      : progress >= step.threshold - 15 
                        ? 'bg-blue-500 text-white animate-pulse' 
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {progress >= step.threshold ? '✓' : index + 1}
                </div>
                <div className={`text-xs transition-colors duration-300 ${
                  progress >= step.threshold - 15 ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}>
                  {step.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 实时日志显示 */}
      {showLogs && logs.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">导入日志</h3>
            <button
              onClick={() => setLogsExpanded(!logsExpanded)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-500"
            >
              {logsExpanded ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {logsExpanded ? '隐藏日志' : '显示日志'}
            </button>
          </div>
          
          {logsExpanded && (
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg max-h-80 overflow-y-auto font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index} className={`mb-1 ${
                  log.type === 'error' ? 'text-red-400' : 
                  log.type === 'success' ? 'text-green-400' : 
                  log.type === 'progress' ? 'text-blue-400' : 
                  'text-gray-300'
                }`}>
                  <span className="text-gray-500 text-xs mr-2">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {log.message}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      )}

      {/* 导入结果 */}
      {result && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <h3 className={`text-lg font-medium ${
              result.success ? 'text-green-900' : 'text-red-900'
            }`}>
              {result.success ? '导入成功' : '导入失败'}
            </h3>
          </div>

          <p className={`text-sm mb-4 ${
            result.success ? 'text-green-700' : 'text-red-700'
          }`}>
            {result.message}
          </p>

          {result.success && result.data && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">
                  {result.data.totalProcessed}
                </div>
                <div className="text-xs text-blue-700">处理记录</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-900">
                  {result.data.newMembers}
                </div>
                <div className="text-xs text-green-700">新增会员</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-900">
                  {result.data.newOrders}
                </div>
                <div className="text-xs text-purple-700">新增订单</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-yellow-900">
                  {result.data.duplicateMembers}
                </div>
                <div className="text-xs text-yellow-700">重复会员</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-orange-900">
                  {result.data.duplicateOrders}
                </div>
                <div className="text-xs text-orange-700">重复订单</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 使用说明 */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">使用说明</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
              1
            </div>
            <div>
              <strong>准备数据：</strong>确保Excel文件包含必要的列，如姓名、手机号、地址、商品信息等
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
              2
            </div>
            <div>
              <strong>上传文件：</strong>拖拽或点击选择Excel文件进行上传
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
              3
            </div>
            <div>
              <strong>自动处理：</strong>系统会自动识别并导入数据，重复的会员和订单会被跳过
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
              4
            </div>
            <div>
              <strong>查看结果：</strong>导入完成后会显示详细的统计信息
            </div>
          </div>
        </div>
      </div>

      {/* 成功弹窗 */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* 背景蒙层 */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={handleCloseSuccessModal}
            ></div>

            {/* 弹窗内容 */}
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                {/* 成功图标 */}
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>

                {/* 标题和内容 */}
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    数据导入成功！
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      数据已成功导入到系统中。
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {countdown > 0 ? (
                        <>
                          如果没有其他操作，将在 
                          <span className="font-bold text-blue-600 text-lg mx-1">
                            {countdown}
                          </span> 
                          秒后自动返回主页
                        </>
                      ) : (
                        '正在跳转到主页...'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* 按钮组 */}
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={handleGoToHome}
                  className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                >
                  <Home className="h-4 w-4 mr-2" />
                  立即返回主页
                </button>
                <button
                  type="button"
                  onClick={handleCloseSuccessModal}
                  className="mt-3 w-full inline-flex justify-center items-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  继续操作
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}