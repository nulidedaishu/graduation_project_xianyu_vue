import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, Product } from '@/types/api'
import { adminLogin, adminLogout, getAdminInfo } from '@/api/auth'
import { getPendingProducts, reviewProduct } from '@/api/product'
import { getUserList } from '@/api/user'
import { ElMessage } from 'element-plus'

export const useAdminStore = defineStore(
  'admin',
  () => {
    // State
    const token = ref<string>('')
    const adminInfo = ref<UserInfo | null>(null)
    const pendingProducts = ref<Product[]>([])
    const users = ref<UserInfo[]>([])
    const loading = ref(false)
    const total = ref(0)

    // Getters
    const isLoggedIn = computed(() => !!token.value)

    // Actions
    const setToken = (newToken: string) => {
      token.value = newToken
      localStorage.setItem('adminToken', newToken)
    }

    const clearToken = () => {
      token.value = ''
      adminInfo.value = null
      localStorage.removeItem('adminToken')
    }

    // 管理员登录
    const login = async (username: string, password: string): Promise<boolean> => {
      try {
        const data = await adminLogin({ username, password })
        setToken(data.token)
        adminInfo.value = data.user
        ElMessage.success('登录成功')
        return true
      } catch (error) {
        return false
      }
    }

    // 管理员登出
    const logout = async () => {
      try {
        await adminLogout()
      } finally {
        clearToken()
        ElMessage.success('已退出登录')
      }
    }

    // 获取管理员信息
    const fetchAdminInfo = async (): Promise<boolean> => {
      try {
        const data = await getAdminInfo()
        adminInfo.value = data
        return true
      } catch (error) {
        clearToken()
        return false
      }
    }

    // 获取待审核商品
    const fetchPendingProducts = async (page = 1, size = 10) => {
      loading.value = true
      try {
        const data = await getPendingProducts({ page, size })
        pendingProducts.value = data.records || []
        total.value = data.total || 0
      } finally {
        loading.value = false
      }
    }

    // 审核商品
    const reviewProductAction = async (productId: number, status: number, auditMsg?: string) => {
      await reviewProduct(productId, { status, auditMsg })
      ElMessage.success('审核完成')
    }

    // 获取用户列表
    const fetchUsers = async (page = 1, size = 10) => {
      loading.value = true
      try {
        const data = await getUserList({ page, size })
        users.value = data.records || []
        total.value = data.total || 0
      } finally {
        loading.value = false
      }
    }

    // 初始化
    const init = () => {
      const savedToken = localStorage.getItem('adminToken')
      if (savedToken) {
        token.value = savedToken
        fetchAdminInfo()
      }
    }

    return {
      token,
      adminInfo,
      pendingProducts,
      users,
      loading,
      total,
      isLoggedIn,
      login,
      logout,
      fetchAdminInfo,
      fetchPendingProducts,
      reviewProductAction,
      fetchUsers,
      init,
    }
  },
  {
    persist: {
      pick: ['token'],
    },
  }
)
