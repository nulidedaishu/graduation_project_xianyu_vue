import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/types/api'
import { getUserInfo, login as loginApi, logout as logoutApi } from '@/api/auth'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore(
  'user',
  () => {
    // State
    const token = ref<string>('')
    const userInfo = ref<UserInfo | null>(null)

    // Getters
    const isLoggedIn = computed(() => !!token.value)
    const username = computed(() => userInfo.value?.username || '')
    const nickname = computed(() => userInfo.value?.nickname || '')
    const avatar = computed(() => userInfo.value?.avatar || '')

    // Actions
    const setToken = (newToken: string) => {
      token.value = newToken
      localStorage.setItem('token', newToken)
    }

    const clearToken = () => {
      token.value = ''
      userInfo.value = null
      localStorage.removeItem('token')
    }

    const setUserInfo = (info: UserInfo) => {
      userInfo.value = info
    }

    // 登录
    const login = async (username: string, password: string): Promise<boolean> => {
      try {
        const data = await loginApi({ username, password })
        setToken(data.token)
        setUserInfo(data.user)
        ElMessage.success('登录成功')
        return true
      } catch (error: any) {
        // 错误消息已在 request.ts 中统一显示
        return false
      }
    }

    // 登出
    const logout = async () => {
      try {
        await logoutApi()
      } finally {
        clearToken()
        ElMessage.success('已退出登录')
      }
    }

    // 获取用户信息
    const fetchUserInfo = async (): Promise<boolean> => {
      try {
        const data = await getUserInfo()
        setUserInfo(data)
        return true
      } catch (error) {
        clearToken()
        return false
      }
    }

    // 初始化（从 localStorage 恢复 token）
    const init = () => {
      const savedToken = localStorage.getItem('token')
      if (savedToken) {
        token.value = savedToken
        // 自动获取用户信息
        fetchUserInfo()
      }
    }

    return {
      token,
      userInfo,
      isLoggedIn,
      username,
      nickname,
      avatar,
      setToken,
      clearToken,
      setUserInfo,
      login,
      logout,
      fetchUserInfo,
      init,
    }
  },
  {
    persist: {
      pick: ['token'], // 只持久化 token
    },
  }
)
