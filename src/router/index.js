import { createRouter, createWebHistory } from 'vue-router'
import Settings from '../views/Settings.vue'
import Problem from '../views/Problem.vue'
import Solution from '../views/Solution.vue'

const routes = [
  {
    path: '/',
    redirect: '/settings'
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: {
      title: '系统设置 - AI-TRIZ 创新引擎 | Settings - AI-TRIZ Innovation Engine'
    }
  },
  {
    path: '/problem',
    name: 'Problem',
    component: Problem,
    meta: {
      title: '问题解构 - AI-TRIZ 创新引擎 | Problem Deconstruction - AI-TRIZ Innovation Engine'
    }
  },
  {
    path: '/solution',
    name: 'Solution',
    component: Solution,
    meta: {
      title: '创新方案推导 - AI-TRIZ 创新引擎 | Solution Derivation - AI-TRIZ Innovation Engine'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 添加全局前置守卫动态修改标题和 SEO 信息
router.afterEach((to) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
})

export default router
