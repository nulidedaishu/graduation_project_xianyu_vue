import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import 'element-plus/dist/index.css'

const app = createApp(App)

app.use(pinia)
app.use(router)

// 初始化用户信息
import { useUserStore, useAdminStore } from './stores'
const userStore = useUserStore()
const adminStore = useAdminStore()
userStore.init()
adminStore.init()

app.mount('#app')
