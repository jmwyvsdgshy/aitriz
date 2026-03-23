<template>
  <div class="h-full flex flex-col bg-slate-50 min-w-[1024px] overflow-hidden">
    <!-- 顶部导航栏 -->
    <header class="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
      <!-- 左侧 Logo & Title -->
      <div class="flex items-center space-x-3 shrink-0 py-4">
        <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform">
          <el-icon class="text-white text-xl"><Lightning /></el-icon>
        </div>
        <div>
          <h1 class="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600 tracking-tight">AI-TRIZ <span class="text-blue-600 font-bold">Pro</span></h1>
          <p class="text-xs text-gray-500 font-medium tracking-wider uppercase mt-0.5">INNOVATION ENGINE</p>
        </div>
      </div>

      <!-- 中间导航菜单 -->
      <div class="flex-1 flex justify-center max-w-3xl mx-8 hidden md:flex">
        <el-menu :default-active="activeMenu" class="h-[64px] border-none !bg-transparent w-full" mode="horizontal" @select="handleSelect" :ellipsis="false">
          <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>{{ t('navSettings') }}
          </el-menu-item>
          <el-menu-item index="/problem">
            <el-icon><EditPen /></el-icon>{{ t('navProblem') }}
          </el-menu-item>
          <el-menu-item index="/solution">
            <el-icon><Opportunity /></el-icon>{{ t('navSolution') }}
          </el-menu-item>
          <el-menu-item index="/inspiration">
            <el-icon><MagicStick /></el-icon>{{ t('navInspiration') }}
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 右侧快捷操作与状态 -->
      <div class="flex items-center space-x-4 shrink-0 ml-4 py-4">
        <!-- 语言切换 -->
        <el-dropdown @command="handleLangChange" trigger="click">
          <span class="el-dropdown-link flex items-center cursor-pointer text-gray-600 hover:text-blue-500 transition-colors">
            <el-icon class="mr-1"><Location /></el-icon>
            {{ currentLang === 'zh' ? '中文' : 'English' }}
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="zh" :disabled="currentLang === 'zh'">中文 (简体)</el-dropdown-item>
              <el-dropdown-item command="en" :disabled="currentLang === 'en'">English</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 公众号关注入口 -->
        <el-tooltip placement="bottom" effect="light">
          <template #content>
            <div class="text-center p-2">
              <p class="font-bold text-gray-800 mb-1">{{ t('followDesc') }}</p>
              <p class="text-blue-500 font-bold text-lg mb-2">AI数术研习社</p>
              <el-button size="small" type="primary" plain @click="copyWechatName">
                {{ t('copyBtn') }}
              </el-button>
            </div>
          </template>
          <el-button type="success" plain icon="ChatDotRound" @click="copyWechatName" class="hover:scale-105 transition-transform">
            {{ t('followAccount') }}
          </el-button>
        </el-tooltip>

        <el-button type="info" plain icon="Lock" class="hidden sm:inline-flex !cursor-default hover:!bg-white hover:!border-gray-300 hover:!text-gray-500" style="pointer-events: none;">
          {{ t('localDataOnly') }}
        </el-button>
        
        <el-button type="primary" plain icon="Share" @click="shareApp">{{ t('shareApp') }}</el-button>
      </div>
    </header>

    <!-- 底部主体内容区 (Router View) -->
    <main class="flex-1 overflow-hidden">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Vercel Analytics 组件 -->
    <Analytics />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from './composables/useI18n'
import { Analytics } from '@vercel/analytics/vue'

const i18nMsgs = {
  zh: {
    navSettings: '1. 系统配置',
    navProblem: '2. 问题定义与分析',
    navSolution: '3. TRIZ 方案生成',
    navInspiration: '4. 跨界灵感看板',
    localDataOnly: '数据仅保留在本地',
    shareApp: '分享应用',
    followAccount: '关注：AI数术研习社',
    followDesc: '前往微信搜索公众号',
    copyBtn: '点击复制公众号名称',
    copySuccess: '公众号名称已复制，请前往微信搜索关注',
    shareSuccess: '应用链接已复制到剪贴板，快去分享吧！'
  },
  en: {
    navSettings: '1. Settings',
    navProblem: '2. Problem Definition',
    navSolution: '3. TRIZ Solutions',
    navInspiration: '4. Inspirations',
    localDataOnly: 'Local Data Only',
    shareApp: 'Share App',
    followAccount: 'Follow Us',
    followDesc: 'Search in WeChat',
    copyBtn: 'Copy Account Name',
    copySuccess: 'Account name copied! Please search in WeChat to follow.',
    shareSuccess: 'App link copied to clipboard!'
  }
}

const { t, currentLang, setLang } = useI18n(i18nMsgs)
const route = useRoute()
const router = useRouter()
const activeMenu = ref(route.path)

watch(() => route.path, (newPath) => {
  activeMenu.value = newPath
})

const handleSelect = (key) => {
  router.push(key)
}

const handleLangChange = (lang) => {
  setLang(lang)
}

const copyWechatName = () => {
  navigator.clipboard.writeText('AI数术研习社').then(() => {
    ElMessage.success(t('copySuccess'))
  })
}

const shareApp = () => {
  navigator.clipboard.writeText(window.location.href).then(() => {
    ElMessage.success(t('shareSuccess'))
  })
}
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>