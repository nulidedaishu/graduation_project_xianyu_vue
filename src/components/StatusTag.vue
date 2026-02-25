<template>
  <el-tag :type="tagType" size="small">{{ statusText }}</el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProductStatusType } from '@/types/api'

const props = defineProps<{
  status: number
}>()

const statusMap: Record<ProductStatusType, { text: string; type: 'success' | 'warning' | 'danger' | 'info' }> = {
  0: { text: '待审核', type: 'warning' },
  1: { text: '已上架', type: 'success' },
  2: { text: '已驳回', type: 'danger' },
  3: { text: '已下架', type: 'info' },
  4: { text: '已售出', type: 'info' },
  5: { text: '已删除', type: 'info' },
}

const statusText = computed(() => {
  return statusMap[props.status as ProductStatusType]?.text || '未知'
})

const tagType = computed(() => {
  return statusMap[props.status as ProductStatusType]?.type || 'info'
})
</script>
