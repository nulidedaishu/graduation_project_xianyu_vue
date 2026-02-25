import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getAllCategories, getCategoryTree } from '@/api/category'
import type { Category, CategoryTreeVO } from '@/types/api'

export const useCategoryStore = defineStore('category', () => {
  // State
  const categories = ref<Category[]>([])
  const categoryTree = ref<CategoryTreeVO[]>([])
  const loading = ref(false)

  // Getters
  const categoryMap = computed(() => {
    const map: Record<number, string> = {}
    categories.value.forEach(cat => {
      map[cat.id] = cat.name
    })
    return map
  })

  const getCategoryNameById = (id: number) => {
    return categoryMap.value[id] || '未知分类'
  }

  // Actions
  const fetchCategories = async () => {
    if (categories.value.length > 0) return
    loading.value = true
    try {
      const data = await getAllCategories()
      categories.value = data || []
    } finally {
      loading.value = false
    }
  }

  const fetchCategoryTree = async () => {
    if (categoryTree.value.length > 0) return
    loading.value = true
    try {
      const data = await getCategoryTree()
      categoryTree.value = data || []
    } finally {
      loading.value = false
    }
  }

  return {
    categories,
    categoryTree,
    loading,
    categoryMap,
    getCategoryNameById,
    fetchCategories,
    fetchCategoryTree,
  }
})