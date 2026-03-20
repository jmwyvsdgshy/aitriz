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
    component: Settings
  },
  {
    path: '/problem',
    name: 'Problem',
    component: Problem
  },
  {
    path: '/solution',
    name: 'Solution',
    component: Solution
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
