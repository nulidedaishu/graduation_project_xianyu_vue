import request from '@/utils/request'

// 根据商品标题生成描述
export const generateProductDescription = (title: string): Promise<{ description: string }> => {
  return request.post('/api/ai/generate-description', { title })
}
