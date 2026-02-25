import request from '@/utils/request'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserInfo,
} from '@/types/api'

// 用户登录
export const login = (data: LoginRequest): Promise<LoginResponse> => {
  return request.post('/api/auth/login', data)
}

// 用户注册
export const register = (data: RegisterRequest): Promise<UserInfo> => {
  return request.post('/api/auth/register', data)
}

// 用户登出
export const logout = (): Promise<void> => {
  return request.post('/api/auth/logout')
}

// 获取当前用户信息
export const getUserInfo = (): Promise<UserInfo> => {
  return request.get('/api/auth/info')
}

// 检查登录状态
export const checkLogin = (): Promise<boolean> => {
  return request.get('/api/auth/check-login')
}

// 管理员登录
export const adminLogin = (data: LoginRequest): Promise<LoginResponse> => {
  return request.post('/api/auth/admin/login', data)
}

// 管理员登出
export const adminLogout = (): Promise<void> => {
  return request.post('/api/auth/admin/logout')
}

// 获取当前管理员信息
export const getAdminInfo = (): Promise<UserInfo> => {
  return request.get('/api/auth/admin/info')
}

// 检查管理员登录状态
export const checkAdminLogin = (): Promise<boolean> => {
  return request.get('/api/auth/admin/check-login')
}
