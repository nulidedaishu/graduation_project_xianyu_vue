import request from '@/utils/request'

export interface AIConfig {
  id?: number
  name: string
  provider: string
  apiKey: string
  baseUrl?: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt?: string
  enabled: number
  isDefault?: number
  updateTime?: string
}

// 获取所有配置
export const getAIConfigs = (): Promise<AIConfig[]> => {
  return request.get('/api/admin/ai-config')
}

// 获取配置详情
export const getAIConfig = (id: number): Promise<AIConfig> => {
  return request.get(`/api/admin/ai-config/${id}`)
}

// 创建配置
export const createAIConfig = (data: AIConfig): Promise<AIConfig> => {
  return request.post('/api/admin/ai-config', data)
}

// 更新配置
export const updateAIConfig = (id: number, data: AIConfig): Promise<AIConfig> => {
  return request.put(`/api/admin/ai-config/${id}`, data)
}

// 删除配置
export const deleteAIConfig = (id: number): Promise<void> => {
  return request.delete(`/api/admin/ai-config/${id}`)
}

// 设置默认配置
export const setDefaultAIConfig = (id: number): Promise<void> => {
  return request.put(`/api/admin/ai-config/${id}/default`)
}

// 启用/禁用配置
export const toggleAIConfigEnabled = (id: number, enabled: number): Promise<void> => {
  return request.put(`/api/admin/ai-config/${id}/enabled?enabled=${enabled}`)
}

// 测试已保存的配置
export const testAIConfig = (id: number): Promise<boolean> => {
  return request.post(`/api/admin/ai-config/${id}/test`)
}

// 测试新配置（保存前）
export const testNewAIConfig = (data: AIConfig): Promise<boolean> => {
  return request.post('/api/admin/ai-config/test', data)
}
