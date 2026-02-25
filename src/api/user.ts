import request from '@/utils/request'
import type { PageResult, UserInfo } from '@/types/api'

// 获取用户列表
export const getUserList = (params?: { page?: number; size?: number }): Promise<PageResult<UserInfo>> => {
  return request.get('/api/users', { params })
}

// 获取用户详情
export const getUserById = (id: number): Promise<UserInfo> => {
  return request.get(`/api/users/${id}`)
}

// 更新用户信息
export const updateUser = (id: number, data: Partial<UserInfo>): Promise<UserInfo> => {
  return request.put(`/api/users/${id}`, data)
}

// 删除用户
export const deleteUser = (id: number): Promise<void> => {
  return request.delete(`/api/users/${id}`)
}

// 获取当前登录用户
export const getCurrentUser = (): Promise<UserInfo> => {
  return request.get('/api/users/me')
}

// 刷新用户session
export const refreshSession = (): Promise<void> => {
  return request.post('/api/users/refresh-session')
}
