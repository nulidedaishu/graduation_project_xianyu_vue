<template>
  <div class="category-nav">
    <!-- 一级分类 -->
    <div class="level-1">
      <div
        v-for="cat1 in categoryTree"
        :key="cat1.id"
        class="cat-1-item"
        :class="{ active: activeId === cat1.id }"
        @mouseenter="handleMouseEnter(cat1)"
        @mouseleave="handleMouseLeave"
        @click="handleCategoryClick(cat1.id)"
      >
        <el-icon size="18">
          <component :is="getCategoryIcon(cat1.icon)" />
        </el-icon>
        <span class="cat-name">{{ cat1.name }}</span>
        <el-icon v-if="cat1.children?.length" size="14" class="arrow">
          <ArrowRight />
        </el-icon>
      </div>
      <!-- 空状态 -->
      <div v-if="categoryTree.length === 0" class="empty-categories">
        <el-empty description="暂无分类" :image-size="60" />
      </div>
    </div>

    <!-- 二三级分类弹层 -->
    <div
      v-show="showSubMenu && activeCategory?.children?.length"
      class="sub-menu"
      @mouseenter="clearHideTimer"
      @mouseleave="handleSubMenuLeave"
    >
      <div v-for="cat2 in activeCategory?.children" :key="cat2.id" class="sub-cat-row">
        <!-- 二级分类标题 -->
        <div class="cat-2-title" @click="handleCategoryClick(cat2.id)">
          <span>{{ cat2.name }}</span>
          <el-icon><ArrowRight /></el-icon>
        </div>
        <!-- 三级分类列表 -->
        <div v-if="cat2.children?.length" class="cat-3-list">
          <span
            v-for="cat3 in cat2.children"
            :key="cat3.id"
            class="cat-3-item"
            @click.stop="handleCategoryClick(cat3.id)"
          >
            {{ cat3.name }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ArrowRight,
  Phone,
  Monitor,
  ShoppingBag,
  Reading,
  House,
  Basketball,
  Sugar,
  More,
  Goods,
  Handbag,
  Football,
} from '@element-plus/icons-vue'
import type { CategoryTreeVO } from '@/types/api'

const props = defineProps<{
  categoryTree: CategoryTreeVO[]
}>()

const activeId = ref<number | null>(null)
const showSubMenu = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | null = null

const activeCategory = computed(() => {
  return props.categoryTree.find(cat => cat.id === activeId.value)
})

// 图标映射
const iconMap: Record<string, string> = {
  'phone': 'Phone',
  'computer': 'Monitor',
  'clothes': 'ShoppingBag',
  'book': 'Reading',
  'furniture': 'House',
  'sports': 'Basketball',
  'toy': 'Sugar',
  'other': 'More',
  'electronics': 'Monitor',
  'clothing': 'Handbag',
  'home': 'House',
  'outdoor': 'Football',
  'goods': 'Goods',
}

const getCategoryIcon = (icon?: string) => {
  return iconMap[icon || ''] || 'Goods'
}

const handleMouseEnter = (cat: CategoryTreeVO) => {
  clearHideTimer()
  if (cat.children?.length) {
    activeId.value = cat.id
    showSubMenu.value = true
  } else {
    activeId.value = null
    showSubMenu.value = false
  }
}

const handleMouseLeave = () => {
  startHideTimer()
}

const handleSubMenuLeave = () => {
  activeId.value = null
  showSubMenu.value = false
}

const clearHideTimer = () => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

const startHideTimer = () => {
  hideTimer = setTimeout(() => {
    showSubMenu.value = false
    activeId.value = null
  }, 150)
}

const handleCategoryClick = (categoryId: number) => {
  const url = `${window.location.origin}/products?categoryId=${categoryId}`
  window.open(url, '_blank')
  showSubMenu.value = false
  activeId.value = null
}
</script>

<style scoped lang="scss">
.category-nav {
  position: relative;
  display: flex;
  min-height: 300px;
  height: 460px;

  .level-1 {
    width: 200px;
    background: #fff;
    border-right: 1px solid #e4e7ed;
    padding: 8px 0;
    display: flex;
    flex-direction: column;

    .empty-categories {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cat-1-item {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      cursor: pointer;
      transition: all 0.2s;

      .cat-name {
        flex: 1;
        margin-left: 10px;
        font-size: 14px;
        color: #606266;
      }

      .arrow {
        color: #c0c4cc;
      }

      &:hover,
      &.active {
        background: #409eff;

        .cat-name,
        .arrow {
          color: #fff;
        }

        :deep(.el-icon) {
          color: #fff !important;
        }
      }
    }
  }

  .sub-menu {
    flex: 1;
    background: #fff;
    padding: 20px 30px;
    overflow-y: auto;

    .sub-cat-row {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      .cat-2-title {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        font-weight: bold;
        font-size: 14px;
        color: #303133;
        cursor: pointer;

        &:hover {
          color: #409eff;
        }

        .el-icon {
          margin-left: 4px;
          font-size: 12px;
        }
      }

      .cat-3-list {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding-left: 10px;

        .cat-3-item {
          padding: 4px 12px;
          font-size: 13px;
          color: #606266;
          background: #f5f7fa;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            color: #fff;
            background: #409eff;
          }
        }
      }
    }
  }
}
</style>
