<template>
  <el-card class="product-card" shadow="hover" @click="$emit('click')">
    <div class="product-image">
      <el-image
        :src="imageUrl"
        fit="cover"
        class="image"
        :preview-src-list="[]"
      >
        <template #error>
          <div class="image-error">
            <el-icon size="40" color="#c0c4cc"><Picture /></el-icon>
          </div>
        </template>
      </el-image>
    </div>

    <div class="product-info">
      <h3 class="product-name">{{ product.name }}</h3>
      <p class="product-desc">{{ product.description }}</p>

      <div class="product-footer">
        <span class="product-price">¥{{ product.price.toFixed(2) }}</span>
        <span class="product-seller">{{ product.userNickname }}</span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Picture } from '@element-plus/icons-vue'
import type { Product } from '@/types/api'

const props = defineProps<{
  product: Product
}>()

defineEmits<{
  (e: 'click'): void
}>()

// 解析图片URL（优先使用主图字段，向后兼容旧字段）
const imageUrl = computed(() => {
  // 优先使用新的主图字段
  if (props.product.mainImageUrl) {
    return props.product.mainImageUrl
  }
  // 向后兼容旧的imageUrls字段
  if (!props.product.imageUrls) {
    return ''
  }
  // 兼容数组类型
  if (Array.isArray(props.product.imageUrls)) {
    return props.product.imageUrls[0] || ''
  }
  // 字符串类型
  if (typeof props.product.imageUrls === 'string') {
    const urls = props.product.imageUrls.split(',')
    return urls[0] || ''
  }
  return ''
})

</script>

<style scoped lang="scss">
.product-card {
  cursor: pointer;
  transition: transform 0.3s;
  margin-bottom: 20px;

  &:hover {
    transform: translateY(-4px);
  }

  :deep(.el-card__body) {
    padding: 0;
  }
}

.product-image {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;

  .image {
    width: 100%;
    height: 100%;
  }

  .image-error {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f7fa;
  }

  .status-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 4px 8px;
    background-color: rgba(0, 0, 0, 0.6);
    color: #fff;
    font-size: 12px;
    border-radius: 4px;
  }
}

.product-info {
  padding: 12px;

  .product-name {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    margin: 0 0 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .product-desc {
    font-size: 12px;
    color: #909399;
    margin: 0 0 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .product-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .product-price {
      font-size: 18px;
      font-weight: bold;
      color: #f56c6c;
    }

    .product-seller {
      font-size: 12px;
      color: #606266;
    }
  }
}
</style>
