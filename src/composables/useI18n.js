import { ref, computed } from 'vue'

const browserLang = navigator.language.startsWith('zh') ? 'zh' : 'en'
const currentLang = ref(localStorage.getItem('triz_lang') || browserLang)

export function useI18n(messages) {
  const setLang = (lang) => {
    currentLang.value = lang
    localStorage.setItem('triz_lang', lang)
  }

  const t = (key) => {
    const langMsgs = messages[currentLang.value] || messages['en'] || {}
    return langMsgs[key] || key
  }

  return {
    currentLang,
    setLang,
    t
  }
}
