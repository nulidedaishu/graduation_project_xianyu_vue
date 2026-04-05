<template>
  <div class="category-select-wrapper" ref="wrapperRef">
    <!-- 触发按钮和已选内容 -->
    <div class="category-trigger">
      <el-button
        :disabled="disabled"
        @click="togglePicker"
        :type="modelValue ? 'primary' : 'default'"
      >
        <el-icon><component :is="modelValue ? Check : ArrowDown" /></el-icon>
        {{ modelValue ? '已选择' : '选择分类' }}
      </el-button>

      <span v-if="modelValue" class="selected-path">
        {{ getCategoryPath(modelValue) }}
      </span>
      <span v-else-if="placeholder" class="placeholder-text">
        {{ placeholder }}
      </span>

      <el-button
        v-if="modelValue && !disabled"
        link
        size="small"
        @click="clearSelection"
        class="clear-btn"
      >
        清除
      </el-button>
    </div>

    <!-- 分类选择器弹窗 -->
    <div v-if="showPicker" class="category-picker">
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
        >
          <div v-for="cat2 in activeLevel1Category.children" :key="cat2.id" class="sub-cat-row">
            <div
              class="cat-2-title"
              :class="{ selected: modelValue === cat2.id, disabled: disabled }"
              @mouseenter="handleMouseEnterLevel2(cat2)"
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
        >
          <div
            v-for="cat3 in activeLevel2Category.children"
            :key="cat3.id"
            class="cat-3-row"
          >
            <div
              class="cat-3-title"
              :class="{ selected: modelValue === cat3.id, disabled: disabled }"
              @click="handleSelect(cat3.id)"
            >
              <span v-html="highlightText(cat3.name)"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  ArrowRight,
  ArrowDown,
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

const wrapperRef = ref<HTMLElement>()
const showPicker = ref(false)
const activeLevel1Id = ref<number | null>(null)
const activeLevel2Id = ref<number | null>(null)
const showLevel2Menu = ref(false)
const showLevel3Menu = ref(false)
const searchText = ref('')

// 切换选择器显示
const togglePicker = () => {
  showPicker.value = !showPicker.value
}

// 关闭选择器
const closePicker = () => {
  showPicker.value = false
}

// 点击外部关闭选择器
const handleClickOutside = (event: MouseEvent) => {
  if (wrapperRef.value && !wrapperRef.value.contains(event.target as Node)) {
    closePicker()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

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
        const isMatch = cat.name.toLowerCase().includes(searchTerm)
        let filteredChildren: CategoryTreeVO[] | undefined
        if (cat.children?.length) {
          filteredChildren = filterTree(cat.children)
        }
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
    debouncedSearch(searchText.value)
  }
}, { immediate: true })

// 显示的分类树
const displayedTree = computed(() => {
  return filteredTree.value
})

// 当前激活的一级分类
const activeLevel1Category = computed(() => {
  return displayedTree.value.find(cat => cat.id === activeLevel1Id.value)
})

// 当前激活的二级分类
const activeLevel2Category = computed(() => {
  if (!activeLevel1Category.value || !activeLevel1Category.value.children) return null
  return activeLevel1Category.value.children.find(cat => cat.id === activeLevel2Id.value)
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

// 高亮文本
const highlightText = (text: string | undefined) => {
  if (!text) return ''
  if (!searchText.value.trim()) return text

  const searchTerm = searchText.value.toLowerCase()
  const lowerText = text.toLowerCase()
  const index = lowerText.indexOf(searchTerm)

  if (index === -1) return text

  const before = text.slice(0, index)
  const match = text.slice(index, index + searchTerm.length)
  const after = text.slice(index + searchTerm.length)

  return `${before}<span class="highlight">${match}</span>${after}`
}

// 获取分类路径
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

// 鼠标交互逻辑
const handleMouseEnter = (cat: CategoryTreeVO) => {
  if (props.disabled) return
  if (cat.children?.length) {
    activeLevel1Id.value = cat.id
    showLevel2Menu.value = true
    activeLevel2Id.value = null
    showLevel3Menu.value = false
  } else {
    activeLevel1Id.value = cat.id
    showLevel2Menu.value = false
    showLevel3Menu.value = false
  }
}

const handleMouseEnterLevel2 = (cat2: CategoryTreeVO) => {
  if (props.disabled) return
  if (cat2.children?.length) {
    activeLevel2Id.value = cat2.id
    showLevel3Menu.value = true
  } else {
    activeLevel2Id.value = null
    showLevel3Menu.value = false
  }
}

// 选择分类
const handleSelect = (categoryId: number) => {
  if (props.disabled) return

  emit('update:modelValue', categoryId)
  emit('change', categoryId)
  closePicker()
}

// 清除选择
const clearSelection = () => {
  if (props.disabled) return

  emit('update:modelValue', undefined)
  emit('change', undefined)
}

onUnmounted(() => {
  debouncedSearch.cancel()
})
</script>

<style scoped lang="scss">
.category-select-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

.category-trigger {
  display: flex;
  align-items: center;
  gap: 12px;

  .selected-path {
    font-size: 14px;
    color: #606266;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .placeholder-text {
    font-size: 14px;
    color: #909399;
    font-style: italic;
  }

  .clear-btn {
    padding: 0;
    height: auto;
    font-size: 12px;
  }
}

.category-picker {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 540px;
  height: 300px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .search-box {
    padding: 12px;
    border-bottom: 1px solid #e4e7ed;
    background: #f8f9fa;
    flex-shrink: 0;

    :deep(.el-input) {
      .el-input__wrapper {
        background: #fff;
      }
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
        height: 36px;
        box-sizing: border-box;

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
      padding: 8px 0;
      overflow-y: auto;
      border-right: 1px solid #e4e7ed;
      height: 100%;
      box-sizing: border-box;

      &.level-2-menu {
        left: 180px;
      }

      &.level-3-menu {
        left: 360px;
      }

      .sub-cat-row,
      .cat-3-row {
        margin-bottom: 0;

        &:last-child {
          margin-bottom: 0;
        }

        .cat-2-title,
        .cat-3-title {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s;
          height: 36px;
          box-sizing: border-box;
          font-size: 13px;
          color: #606266;

          span {
            flex: 1;
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

          .el-icon {
            margin-left: 4px;
            font-size: 12px;
            color: #c0c4cc;
          }

          &:hover:not(.disabled),
          &.active:not(.disabled) {
            background: #409eff;
            color: #fff;

            .el-icon {
              color: #fff;
            }

            span :deep(.highlight) {
              color: #fff;
              background-color: rgba(255, 255, 255, 0.3);
            }
          }

          &.selected:not(.disabled) {
            background: #ecf5ff;
            color: #409eff;
            font-weight: 500;
            border-right: 3px solid #409eff;

            .el-icon {
              color: #409eff;
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
      }
    }
  }
}
</style>
