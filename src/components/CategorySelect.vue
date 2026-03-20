<template>
  <div class="category-select">
    <!-- 搜索框 -->
    <div class="search-box">
      <el-input
        v-model="searchText"
        :placeholder="searchPlaceholder || '搜索分类...'"
        clearable
        @input="handleSearch"
        @clear="clearSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 选中状态显示 -->
    <div v-if="modelValue" class="selected-display">
      <el-icon><Check /></el-icon>
      <span class="selected-text">已选择：{{ getCategoryPath(modelValue) }}</span>
      <el-button
        v-if="!disabled"
        type="text"
        size="small"
        @click="clearSelection"
        class="clear-btn"
      >
        清除
      </el-button>
    </div>
    <div v-else-if="placeholder" class="placeholder-display">
      <span class="placeholder-text">{{ placeholder }}</span>
    </div>

    <!-- 分类选择区域 -->
    <div class="category-content">
      <!-- 一级分类 -->
      <div class="level-1">
        <div
          v-for="cat1 in displayedTree"
          :key="cat1.id"
          class="cat-1-item"
          :class="{
            active: activeLevel1Id === cat1.id,
            selected: modelValue === cat1.id,
            disabled: disabled
          }"
          @mouseenter="handleMouseEnter(cat1)"
          @mouseleave="handleMouseLeave"
          @click="handleSelect(cat1.id)"
        >
          <el-icon size="16">
            <component :is="getCategoryIcon(cat1.icon)" />
          </el-icon>
          <span class="cat-name" v-html="highlightText(cat1.name)"></span>
          <el-icon v-if="cat1.children?.length" size="12" class="arrow">
            <ArrowRight />
          </el-icon>
        </div>
        <!-- 空状态 -->
        <div v-if="displayedTree.length === 0" class="empty-categories">
          <el-empty
            :description="searchText ? '未找到匹配的分类' : '暂无分类'"
            :image-size="50"
          />
        </div>
      </div>

      <!-- 二级分类弹层 -->
      <div
        v-if="showLevel2Menu && activeLevel1Category && activeLevel1Category.children?.length"
        class="sub-menu level-2-menu"
        @mouseenter="clearHideTimer"
        @mouseleave="handleLevel2MenuLeave"
      >
        <div v-for="cat2 in activeLevel1Category.children" :key="cat2.id" class="sub-cat-row">
          <!-- 二级分类标题 -->
          <div
            class="cat-2-title"
            :class="{ selected: modelValue === cat2.id, disabled: disabled }"
            @mouseenter="handleMouseEnterLevel2(cat2)"
            @mouseleave="handleMouseLeaveLevel2"
            @click="handleSelect(cat2.id)"
          >
            <span v-html="highlightText(cat2.name)"></span>
            <el-icon v-if="cat2.children?.length"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <!-- 三级分类弹层 -->
      <div
        v-if="showLevel3Menu && activeLevel2Category && activeLevel2Category.children?.length"
        class="sub-menu level-3-menu"
        @mouseenter="clearHideTimer"
        @mouseleave="handleMouseLeaveLevel2"
      >
        <div class="cat-3-list">
          <span
            v-for="cat3 in activeLevel2Category.children"
            :key="cat3.id"
            class="cat-3-item"
            :class="{ selected: modelValue === cat3.id, disabled: disabled }"
            @click.stop="handleSelect(cat3.id)"
            v-html="highlightText(cat3.name)"
          ></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
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
  Search,
  Check,
} from '@element-plus/icons-vue'
import type { CategoryTreeVO } from '@/types/api'

// 简单的防抖函数
const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return debounced
}

const props = defineProps<{
  modelValue: number | undefined
  categoryTree: CategoryTreeVO[]
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [value: number | undefined]
}>()

const activeLevel1Id = ref<number | null>(null)
const activeLevel2Id = ref<number | null>(null)
const showLevel2Menu = ref(false)
const showLevel3Menu = ref(false)
const searchText = ref('')
let hideTimer: ReturnType<typeof setTimeout> | null = null
let hideLevel3Timer: ReturnType<typeof setTimeout> | null = null

// 防抖搜索处理
const debouncedSearch = debounce((value: string) => {
  if (!value.trim()) {
    filteredTree.value = props.categoryTree
    return
  }

  const searchTerm = value.toLowerCase()
  const filterTree = (tree: CategoryTreeVO[]): CategoryTreeVO[] => {
    return tree
      .map(cat => {
        // 检查当前分类是否匹配
        const isMatch = cat.name.toLowerCase().includes(searchTerm)

        // 递归过滤子分类
        let filteredChildren: CategoryTreeVO[] | undefined
        if (cat.children?.length) {
          filteredChildren = filterTree(cat.children)
        }

        // 如果当前分类匹配或子分类有匹配，则保留
        if (isMatch || (filteredChildren && filteredChildren.length > 0)) {
          return {
            ...cat,
            children: filteredChildren
          }
        }
        return null
      })
      .filter(Boolean) as CategoryTreeVO[]
  }

  filteredTree.value = filterTree(props.categoryTree)
}, 300)

// 处理搜索输入
const handleSearch = (value: string) => {
  searchText.value = value
  debouncedSearch(value)
}

// 清除搜索
const clearSearch = () => {
  searchText.value = ''
  filteredTree.value = props.categoryTree
}

// 过滤后的分类树
const filteredTree = ref<CategoryTreeVO[]>(props.categoryTree)

// 监视原始分类树变化
watch(() => props.categoryTree, (newTree) => {
  filteredTree.value = newTree
  if (searchText.value) {
    // 如果正在搜索，重新过滤
    debouncedSearch(searchText.value)
  }
}, { immediate: true })

// 显示的分类树（搜索时使用过滤后的，否则使用原始）
const displayedTree = computed(() => {
  return filteredTree.value
})

// 当前激活的一级分类（用于显示二级菜单）
const activeLevel1Category = computed(() => {
  return displayedTree.value.find(cat => cat.id === activeLevel1Id.value)
})

// 当前激活的二级分类（用于显示三级菜单）
const activeLevel2Category = computed(() => {
  if (!activeLevel1Category.value || !activeLevel1Category.value.children) return null
  return activeLevel1Category.value.children.find(cat => cat.id === activeLevel2Id.value)
})

// 图标映射（从CategoryNav.vue复制）
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

// 高亮文本（简单的文本高亮，注意XSS防护）
const highlightText = (text: string | undefined) => {
  if (!text) return ''
  if (!searchText.value.trim()) return text

  const searchTerm = searchText.value.toLowerCase()
  const lowerText = text.toLowerCase()
  const index = lowerText.indexOf(searchTerm)

  if (index === -1) return text

  // 安全地构建高亮文本（避免XSS）
  const before = text.slice(0, index)
  const match = text.slice(index, index + searchTerm.length)
  const after = text.slice(index + searchTerm.length)

  return `${before}<span class="highlight">${match}</span>${after}`
}

// 获取分类路径（用于显示选中状态）
const getCategoryPath = (categoryId: number): string => {
  const findPath = (tree: CategoryTreeVO[], id: number, path: string[] = []): string[] | null => {
    for (const cat of tree) {
      const currentPath = [...path, cat.name]
      if (cat.id === id) {
        return currentPath
      }
      if (cat.children?.length) {
        const childPath = findPath(cat.children, id, currentPath)
        if (childPath) return childPath
      }
    }
    return null
  }

  const path = findPath(props.categoryTree, categoryId)
  return path ? path.join(' > ') : '未知分类'
}

// 鼠标交互逻辑（从CategoryNav.vue复制并修改）
const handleMouseEnter = (cat: CategoryTreeVO) => {
  if (props.disabled) return
  clearHideTimer()
  if (cat.children?.length) {
    activeLevel1Id.value = cat.id
    showLevel2Menu.value = true
    // 切换到新的一级分类时，重置二级和三级菜单状态
    activeLevel2Id.value = null
    showLevel3Menu.value = false
  } else {
    activeLevel1Id.value = null
    showLevel2Menu.value = false
    showLevel3Menu.value = false
  }
}

// 二级分类鼠标悬停
const handleMouseEnterLevel2 = (cat2: CategoryTreeVO) => {
  if (props.disabled) return
  clearHideTimer()
  // 清除三级菜单隐藏计时器
  if (hideLevel3Timer) {
    clearTimeout(hideLevel3Timer)
    hideLevel3Timer = null
  }
  if (cat2.children?.length) {
    activeLevel2Id.value = cat2.id
    showLevel3Menu.value = true
  } else {
    activeLevel2Id.value = null
    showLevel3Menu.value = false
  }
}

// 二级分类鼠标离开
const handleMouseLeaveLevel2 = () => {
  // 延迟隐藏三级菜单
  if (!showLevel3Menu.value) return
  if (hideLevel3Timer) {
    clearTimeout(hideLevel3Timer)
  }
  hideLevel3Timer = setTimeout(() => {
    if (!showLevel3Menu.value) return
    showLevel3Menu.value = false
    activeLevel2Id.value = null
  }, 150)
}

const handleMouseLeave = () => {
  startHideTimer()
}

const handleLevel2MenuLeave = () => {
  activeLevel1Id.value = null
  showLevel2Menu.value = false
  // 离开二级菜单时也隐藏三级菜单
  activeLevel2Id.value = null
  showLevel3Menu.value = false
}

const clearHideTimer = () => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  if (hideLevel3Timer) {
    clearTimeout(hideLevel3Timer)
    hideLevel3Timer = null
  }
}

const startHideTimer = () => {
  if (props.disabled) return
  hideTimer = setTimeout(() => {
    showLevel2Menu.value = false
    showLevel3Menu.value = false
    activeLevel1Id.value = null
    activeLevel2Id.value = null
  }, 150)
}

// 选择分类
const handleSelect = (categoryId: number) => {
  if (props.disabled) return

  emit('update:modelValue', categoryId)
  emit('change', categoryId)

  // 选择后关闭子菜单
  showLevel2Menu.value = false
  showLevel3Menu.value = false
  activeLevel1Id.value = null
  activeLevel2Id.value = null
}

// 清除选择
const clearSelection = () => {
  if (props.disabled) return

  emit('update:modelValue', undefined)
  emit('change', undefined)
}

// 组件卸载时清理
onUnmounted(() => {
  clearHideTimer()
  debouncedSearch.cancel()
})
</script>

<style scoped lang="scss">
.category-select {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 200px;
  max-height: 300px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  overflow: hidden;

  .search-box {
    padding: 12px;
    border-bottom: 1px solid #e4e7ed;
    background: #f8f9fa;

    :deep(.el-input) {
      .el-input__wrapper {
        background: #fff;
      }
    }
  }

  .selected-display,
  .placeholder-display {
    padding: 8px 12px;
    border-bottom: 1px solid #e4e7ed;
    background: #f8f9fa;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #606266;

    .el-icon {
      color: #67c23a;
      font-size: 14px;
    }

    .selected-text {
      flex: 1;
    }

    .placeholder-text {
      color: #909399;
      font-style: italic;
    }

    .clear-btn {
      padding: 0;
      height: auto;
      font-size: 12px;
    }
  }

  .category-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;

    .level-1 {
      width: 180px;
      background: #fff;
      border-right: 1px solid #e4e7ed;
      padding: 8px 0;
      display: flex;
      flex-direction: column;
      overflow-y: auto;

      .empty-categories {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;

        :deep(.el-empty) {
          padding: 20px 0;

          .el-empty__description {
            font-size: 12px;
            color: #909399;
          }
        }
      }

      .cat-1-item {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        cursor: pointer;
        transition: all 0.2s;
        min-height: 36px;

        .cat-name {
          flex: 1;
          margin-left: 8px;
          font-size: 13px;
          color: #606266;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          :deep(.highlight) {
            color: #409eff;
            font-weight: 500;
            background-color: #ecf5ff;
            padding: 0 2px;
            border-radius: 2px;
          }
        }

        .arrow {
          color: #c0c4cc;
        }

        &:hover:not(.disabled),
        &.active:not(.disabled) {
          background: #409eff;

          .cat-name,
          .arrow {
            color: #fff;
          }

          :deep(.el-icon) {
            color: #fff !important;
          }

          .cat-name :deep(.highlight) {
            color: #fff;
            background-color: rgba(255, 255, 255, 0.3);
          }
        }

        &.selected:not(.disabled) {
          background: #ecf5ff;
          border-right: 3px solid #409eff;

          .cat-name,
          .arrow {
            color: #409eff;
            font-weight: 500;
          }

          :deep(.el-icon) {
            color: #409eff !important;
          }

          .cat-name :deep(.highlight) {
            color: #409eff;
            background-color: rgba(64, 158, 255, 0.1);
          }
        }

        &.disabled {
          cursor: not-allowed;
          opacity: 0.6;

          .cat-name,
          .arrow {
            color: #c0c4cc;
          }

          :deep(.el-icon) {
            color: #c0c4cc !important;
          }
        }
      }
    }

    .sub-menu {
      position: absolute;
      top: 0;
      width: 180px;
      background: #fff;
      padding: 12px 20px;
      overflow-y: auto;
      border-right: 1px solid #e4e7ed;
      height: 100%;
      box-sizing: border-box;

      .level-2-menu {
        left: 180px;
      }

      .level-3-menu {
        left: 360px;
      }

      .sub-cat-row {
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
        }

        .cat-2-title {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          font-weight: bold;
          font-size: 13px;
          color: #303133;
          cursor: pointer;
          padding: 4px 0;
          transition: all 0.2s;

          span {
            flex: 1;

            :deep(.highlight) {
              color: #409eff;
              font-weight: 500;
              background-color: #ecf5ff;
              padding: 0 2px;
              border-radius: 2px;
            }
          }

          .el-icon {
            margin-left: 4px;
            font-size: 11px;
          }

          &:hover:not(.disabled) {
            color: #409eff;
          }

          &.selected:not(.disabled) {
            color: #409eff;
            position: relative;

            &::before {
              content: '';
              position: absolute;
              left: -8px;
              top: 50%;
              transform: translateY(-50%);
              width: 4px;
              height: 16px;
              background: #409eff;
              border-radius: 2px;
            }

            span :deep(.highlight) {
              color: #409eff;
              background-color: rgba(64, 158, 255, 0.1);
            }
          }

          &.disabled {
            cursor: not-allowed;
            opacity: 0.6;
            color: #c0c4cc;
          }
        }

        .cat-3-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding-left: 8px;

          .cat-3-item {
            padding: 3px 10px;
            font-size: 12px;
            color: #606266;
            background: #f5f7fa;
            border-radius: 3px;
            cursor: pointer;
            transition: all 0.2s;

            :deep(.highlight) {
              color: #409eff;
              font-weight: 500;
              background-color: #ecf5ff;
              padding: 0 2px;
              border-radius: 2px;
            }

            &:hover:not(.disabled) {
              color: #fff;
              background: #409eff;

              :deep(.highlight) {
                color: #fff;
                background-color: rgba(255, 255, 255, 0.3);
              }
            }

            &.selected:not(.disabled) {
              color: #409eff;
              background: #ecf5ff;
              font-weight: 500;
              box-shadow: 0 0 0 1px #409eff inset;

              :deep(.highlight) {
                color: #409eff;
                background-color: rgba(64, 158, 255, 0.1);
              }
            }

            &.disabled {
              cursor: not-allowed;
              opacity: 0.6;
              color: #c0c4cc;
              background: #f0f2f5;
            }
          }
        }
      }
    }
  }
}
</style>