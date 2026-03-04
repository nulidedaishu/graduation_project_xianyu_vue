import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { Cart, CartAddRequest } from '@/types/api'
import { addToCart, getCartList, getCartCount, updateCartQuantity, removeFromCart, clearCart as clearCartApi, checkStockBatch, lockStockBatch } from '@/api/cart'

export const useCartStore = defineStore(
  'cart',
  () => {
    // State
    const cartItems = ref<Cart[]>([])
    const loading = ref(false)
    const selectedItems = ref<number[]>([])
    const cartCount = ref(0)  // 购物车商品数量（从接口获取）

    // Getters
    const cartItemCount = computed(() => cartItems.value.length)

    const cartTotalCount = computed(() => {
      return cartItems.value.reduce((total, item) => total + item.quantity, 0)
    })

    const selectedCartItems = computed(() => {
      return cartItems.value.filter(item => selectedItems.value.includes(item.id))
    })

    const selectedTotalAmount = computed(() => {
      return selectedCartItems.value.reduce((total, item) => {
        return total + item.price * item.quantity
      }, 0)
    })

    const isAllSelected = computed(() => {
      return cartItems.value.length > 0 && selectedItems.value.length === cartItems.value.length
    })

    // Actions
    // 获取购物车数量
    const fetchCartCount = async () => {
      try {
        const count = await getCartCount()
        cartCount.value = count
        return count
      } catch (error: any) {
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
          console.log('购物车数量请求被取消')
          return cartCount.value
        }
        console.error('获取购物车数量失败:', error)
        return 0
      }
    }

    // 获取购物车列表
    const fetchCartList = async () => {
      loading.value = true
      try {
        const data = await getCartList()
        cartItems.value = data
        // 清空已选择项
        selectedItems.value = []
        // 同步更新购物车数量
        cartCount.value = data.length
        return data
      } catch (error: any) {
        // 如果是请求被取消的错误，不更新购物车数据
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
          console.log('购物车请求被取消，保持现有数据')
          return cartItems.value // 返回现有数据
        }
        // 其他错误返回空数组但不更新状态
        console.error('获取购物车失败:', error)
        return []
      } finally {
        loading.value = false
      }
    }

    // 添加商品到购物车
    const addToCartAction = async (data: CartAddRequest) => {
      try {
        const result = await addToCart(data)
        // 如果购物车中已存在该商品，更新数量
        const existingItem = cartItems.value.find(item => item.productId === data.productId)
        if (existingItem) {
          existingItem.quantity = result.quantity
        } else {
          cartItems.value.push(result)
          // 增加购物车数量
          cartCount.value++
        }
        ElMessage.success('已添加到购物车')
        return true
      } catch (error: any) {
        // 显示后端返回的错误消息（如库存不足）
        const message = error?.response?.data?.message
        if (message) {
          ElMessage.error(message)
        }
        return false
      }
    }

    // 更新购物车商品数量
    const updateQuantityAction = async (cartId: number, quantity: number) => {
      const item = cartItems.value.find(item => item.id === cartId)
      if (!item) return false

      // 前端预校验：检查是否超过可用库存
      if (quantity > item.stock) {
        ElMessage.error(`库存不足，当前可用库存为 ${item.stock} 件`)
        return false
      }

      try {
        await updateCartQuantity(cartId, { quantity })
        item.quantity = quantity
        return true
      } catch (error: any) {
        // 如果后端返回库存不足错误，刷新购物车数据
        if (error?.response?.data?.message?.includes('库存')) {
          ElMessage.error(error.response.data.message)
          fetchCartList()
        }
        return false
      }
    }

    // 删除购物车商品
    const removeFromCartAction = async (cartId: number) => {
      try {
        await removeFromCart(cartId)
        cartItems.value = cartItems.value.filter(item => item.id !== cartId)
        selectedItems.value = selectedItems.value.filter(id => id !== cartId)
        // 减少购物车数量
        if (cartCount.value > 0) {
          cartCount.value--
        }
        ElMessage.success('已删除')
        return true
      } catch (error) {
        return false
      }
    }

    // 批量删除购物车商品
    const batchRemoveAction = async (cartIds: number[]) => {
      try {
        await Promise.all(cartIds.map(id => removeFromCart(id)))
        cartItems.value = cartItems.value.filter(item => !cartIds.includes(item.id))
        selectedItems.value = selectedItems.value.filter(id => !cartIds.includes(id))
        // 减少购物车数量
        cartCount.value = Math.max(0, cartCount.value - cartIds.length)
        ElMessage.success('已删除选中的商品')
        return true
      } catch (error) {
        return false
      }
    }

    // 清空购物车
    const clearCartAction = async () => {
      try {
        await clearCartApi()
        cartItems.value = []
        selectedItems.value = []
        // 重置购物车数量
        cartCount.value = 0
        ElMessage.success('购物车已清空')
        return true
      } catch (error) {
        return false
      }
    }

    // 选择/取消选择商品
    const toggleSelection = (cartId: number) => {
      const index = selectedItems.value.indexOf(cartId)
      if (index > -1) {
        selectedItems.value.splice(index, 1)
      } else {
        selectedItems.value.push(cartId)
      }
    }

    // 全选/取消全选
    const toggleSelectAll = () => {
      if (isAllSelected.value) {
        selectedItems.value = []
      } else {
        selectedItems.value = cartItems.value.map(item => item.id)
      }
    }

    // 清空选择
    const clearSelection = () => {
      selectedItems.value = []
    }

    // 校验选中商品的库存
    const checkSelectedStock = async (): Promise<boolean> => {
      const selectedCartItems = cartItems.value.filter(item =>
        selectedItems.value.includes(item.id)
      )

      if (selectedCartItems.length === 0) return false

      try {
        const stockChecks = selectedCartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        }))

        const results = await checkStockBatch(stockChecks)

        // 检查是否有库存不足的商品
        const insufficientItems = results.filter(r => !r.sufficient)

        if (insufficientItems.length > 0) {
          // 显示第一个库存不足的商品
          const item = insufficientItems[0]
          ElMessage.error(`商品【${item.productName}】库存不足，已售罄`)
          return false
        }

        return true
      } catch (error: any) {
        console.error('库存校验失败:', error)
        ElMessage.error(error.message || '库存校验失败，请稍后重试')
        return false
      }
    }

    // 锁定选中商品的库存
    const lockSelectedStock = async (): Promise<boolean> => {
      const selectedCartItems = cartItems.value.filter(item =>
        selectedItems.value.includes(item.id)
      )

      if (selectedCartItems.length === 0) return false

      try {
        const lockRequests = selectedCartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        }))

        const results = await lockStockBatch(lockRequests)

        // 检查是否有锁定失败的商品
        const failedItems = results.filter(r => !r.success)

        if (failedItems.length > 0) {
          // 显示第一个锁定失败的商品
          const item = failedItems[0]
          ElMessage.error(`商品【${item.productName}】库存不足，已售罄`)
          return false
        }

        return true
      } catch (error: any) {
        console.error('库存锁定失败:', error)
        ElMessage.error(error.message || '库存锁定失败，请稍后重试')
        return false
      }
    }

    return {
      // State
      cartItems,
      loading,
      selectedItems,
      cartCount,
      // Getters
      cartItemCount,
      cartTotalCount,
      selectedCartItems,
      selectedTotalAmount,
      isAllSelected,
      // Actions
      fetchCartList,
      fetchCartCount,
      addToCartAction,
      updateQuantityAction,
      removeFromCartAction,
      batchRemoveAction,
      clearCartAction,
      toggleSelection,
      toggleSelectAll,
      clearSelection,
      checkSelectedStock,
      lockSelectedStock,
    }
  }
)
