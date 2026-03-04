<template>
  <div class="cart-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>购物车</h1>
      <el-button
        v-if="cartStore.cartItems.length > 0"
        type="danger"
        text
        @click="handleClearCart"
      >
        清空购物车
      </el-button>
    </div>

    <!-- 购物车列表 -->
    <div v-if="cartStore.cartItems.length > 0" class="cart-content">
      <!-- 表头 -->
      <div class="cart-header">
        <div class="col-checkbox">
          <el-checkbox
            v-model="cartStore.isAllSelected"
            @change="cartStore.toggleSelectAll"
          >
            全选
          </el-checkbox>
        </div>
        <div class="col-product">商品信息</div>
        <div class="col-price">单价</div>
        <div class="col-quantity">数量</div>
        <div class="col-total">小计</div>
        <div class="col-action">操作</div>
      </div>

      <!-- 购物车商品列表 -->
      <div class="cart-list">
        <div
          v-for="item in cartStore.cartItems"
          :key="item.id"
          class="cart-item"
        >
          <div class="col-checkbox">
            <el-checkbox
              :model-value="cartStore.selectedItems.includes(item.id)"
              :disabled="item.stock <= 0"
              @change="() => cartStore.toggleSelection(item.id)"
            />
          </div>

          <div class="col-product">
            <div class="product-info" @click="goToProduct(item.productId)">
              <el-image
                :src="item.productImage || '/placeholder.png'"
                fit="cover"
                class="product-image"
              />
              <div class="product-detail">
                <div class="product-name">{{ item.productName }}</div>
                <div v-if="item.stock <= 0" class="stock-sold-out">
                  已售罄
                </div>
                <div v-else-if="item.stock <= 5" class="stock-warning">
                  库存紧张（仅剩{{ item.stock }}件）
                </div>
              </div>
            </div>
          </div>

          <div class="col-price">
            <span class="price">¥{{ item.price.toFixed(2) }}</span>
          </div>

          <div class="col-quantity">
            <el-input-number
              v-model="item.quantity"
              :min="1"
              :max="item.stock"
              size="small"
              :disabled="item.stock <= 0"
              @change="(val: number) => handleQuantityChange(item.id, val)"
            />
          </div>

          <div class="col-total">
            <span class="total-price">¥{{ (item.price * item.quantity).toFixed(2) }}</span>
          </div>

          <div class="col-action">
            <el-button
              type="danger"
              text
              @click="handleRemove(item.id)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>

      <!-- 底部结算栏 -->
      <div class="cart-footer">
        <div class="footer-left">
          <el-checkbox
            v-model="cartStore.isAllSelected"
            @change="cartStore.toggleSelectAll"
          >
            全选
          </el-checkbox>
          <el-button
            type="danger"
            text
            :disabled="cartStore.selectedItems.length === 0"
            @click="handleBatchRemove"
          >
            删除选中
          </el-button>
        </div>

        <div class="footer-right">
          <div class="summary">
            <span class="selected-count">
              已选 <strong>{{ cartStore.selectedItems.length }}</strong> 件商品
            </span>
            <span class="total-amount">
              合计：<strong>¥{{ cartStore.selectedTotalAmount.toFixed(2) }}</strong>
            </span>
          </div>
          <el-button
            type="primary"
            size="large"
            :disabled="cartStore.selectedItems.length === 0"
            @click="handleCheckout"
          >
            去结算
          </el-button>
        </div>
      </div>
    </div>

    <!-- 空购物车 -->
    <el-empty
      v-else
      description="购物车是空的，快去选购商品吧"
    >
      <template #extra>
        <el-button type="primary" @click="router.push('/home')">去逛逛</el-button>
      </template>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores'

const router = useRouter()
const cartStore = useCartStore()

// 获取购物车列表
onMounted(() => {
  cartStore.fetchCartList()
})

// 数量变更
const handleQuantityChange = async (cartId: number, quantity: number) => {
  await cartStore.updateQuantityAction(cartId, quantity)
}

// 删除商品
const handleRemove = async (cartId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除该商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await cartStore.removeFromCartAction(cartId)
  } catch {
    // 取消删除
  }
}

// 批量删除
const handleBatchRemove = async () => {
  if (cartStore.selectedItems.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${cartStore.selectedItems.length} 件商品吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    await cartStore.batchRemoveAction([...cartStore.selectedItems])
  } catch {
    // 取消删除
  }
}

// 清空购物车
const handleClearCart = async () => {
  try {
    await ElMessageBox.confirm('确定要清空购物车吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await cartStore.clearCartAction()
  } catch {
    // 取消清空
  }
}

// 去结算
const handleCheckout = async () => {
  if (cartStore.selectedItems.length === 0) {
    ElMessage.warning('请选择要结算的商品')
    return
  }

  // 先校验库存
  const stockValid = await cartStore.checkSelectedStock()
  if (!stockValid) {
    // 库存校验失败，刷新购物车数据
    cartStore.fetchCartList()
    return
  }

  // 跳转到订单确认页（库存锁定移到提交订单时）
  router.push({
    path: '/order/confirm',
    query: {
      cartIds: cartStore.selectedItems.join(','),
    },
  })
}

// 跳转到商品详情
const goToProduct = (productId: number) => {
  router.push(`/product/${productId}`)
}
</script>

<style scoped lang="scss">
.cart-view {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h1 {
      font-size: 24px;
      margin: 0;
      color: #303133;
    }
  }

  .cart-content {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  }

  // 表头
  .cart-header {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    background: #f5f7fa;
    border-radius: 8px 8px 0 0;
    font-weight: 500;
    color: #606266;

    .col-checkbox {
      width: 80px;
    }

    .col-product {
      flex: 1;
    }

    .col-price,
    .col-quantity,
    .col-total,
    .col-action {
      width: 120px;
      text-align: center;
    }
  }

  // 购物车列表
  .cart-list {
    .cart-item {
      display: flex;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #ebeef5;
      transition: background-color 0.3s;

      &:hover {
        background-color: #f5f7fa;
      }

      .col-checkbox {
        width: 80px;
      }

      .col-product {
        flex: 1;

        .product-info {
          display: flex;
          gap: 16px;
          cursor: pointer;

          .product-image {
            width: 80px;
            height: 80px;
            border-radius: 4px;
            flex-shrink: 0;
          }

          .product-detail {
            display: flex;
            flex-direction: column;
            justify-content: center;

            .product-name {
              font-size: 14px;
              color: #303133;
              line-height: 1.5;
              margin-bottom: 8px;

              &:hover {
                color: #409eff;
              }
            }

            .stock-warning {
              font-size: 12px;
              color: #e6a23c;
            }

            .stock-sold-out {
              font-size: 12px;
              color: #f56c6c;
              font-weight: bold;
            }
          }
        }
      }

      .col-price,
      .col-quantity,
      .col-total,
      .col-action {
        width: 120px;
        text-align: center;
      }

      .col-price {
        .price {
          color: #606266;
        }
      }

      .col-total {
        .total-price {
          color: #f56c6c;
          font-weight: bold;
          font-size: 16px;
        }
      }
    }
  }

  // 底部结算栏
  .cart-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #f5f7fa;
    border-radius: 0 0 8px 8px;

    .footer-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .footer-right {
      display: flex;
      align-items: center;
      gap: 20px;

      .summary {
        display: flex;
        align-items: center;
        gap: 20px;

        .selected-count {
          color: #606266;

          strong {
            color: #409eff;
          }
        }

        .total-amount {
          color: #606266;
          font-size: 16px;

          strong {
            color: #f56c6c;
            font-size: 24px;
          }
        }
      }
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .cart-view {
    .cart-header {
      display: none;
    }

    .cart-list {
      .cart-item {
        flex-wrap: wrap;
        gap: 12px;

        .col-checkbox {
          width: auto;
        }

        .col-product {
          width: 100%;
          order: -1;
          flex: none;
        }

        .col-price,
        .col-quantity,
        .col-total,
        .col-action {
          width: auto;
          flex: 1;
        }
      }
    }

    .cart-footer {
      flex-direction: column;
      gap: 16px;

      .footer-left,
      .footer-right {
        width: 100%;
        justify-content: space-between;
      }
    }
  }
}
</style>
