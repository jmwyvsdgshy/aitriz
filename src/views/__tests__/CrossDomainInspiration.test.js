import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CrossDomainInspiration from '../CrossDomainInspiration.vue'
import { store } from '../../store'

// Mock useI18n
vi.mock('../../composables/useI18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    currentLang: { value: 'zh' }
  })
}))

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

// Mock Element Plus components
const ElButton = { template: '<button><slot></slot></button>' }
const ElIcon = { template: '<i><slot></slot></i>' }
const ElTag = { template: '<span><slot></slot></span>' }

describe('CrossDomainInspiration.vue', () => {
  beforeEach(() => {
    // Reset store
    store.structData = null
    // Reset localStorage
    localStorage.clear()
    // Mock fetch
    global.fetch = vi.fn()
  })

  it('renders "needAnalysisTitle" when store.structData is empty', () => {
    const wrapper = mount(CrossDomainInspiration, {
      global: {
        components: { ElButton, ElIcon, ElTag },
        stubs: ['MagicStick', 'Warning', 'Back', 'Opportunity', 'Loading', 'Monitor', 'Connection']
      }
    })
    
    expect(wrapper.text()).toContain('needAnalysisTitle')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('renders "waitTitle" when store.structData exists but no inspirations yet', () => {
    store.structData = { techSystem: 'Drone', problem: 'Heavy battery' }
    
    const wrapper = mount(CrossDomainInspiration, {
      global: {
        components: { ElButton, ElIcon, ElTag },
        stubs: ['MagicStick', 'Warning', 'Back', 'Opportunity', 'Loading', 'Monitor', 'Connection']
      }
    })
    
    expect(wrapper.text()).toContain('waitTitle')
    // Generate button should be enabled
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()
  })

  it('handles successful API generation', async () => {
    store.structData = { techSystem: 'Drone', problem: 'Heavy battery' }
    localStorage.setItem('triz_api_config', JSON.stringify({
      apiKey: 'test-key',
      baseUrl: 'https://api.example.com',
      modelName: 'test-model'
    }))

    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            inspirations: [
              {
                principle: "分割原理",
                abstract_reasoning: "测试抽象逻辑",
                domains: [
                  {
                    domain_name: "生物学",
                    case_name: "细胞分裂",
                    case_desc: "测试案例描述",
                    inspiration_for_user: "测试启发"
                  }
                ]
              }
            ]
          })
        }
      }]
    }

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    const wrapper = mount(CrossDomainInspiration, {
      global: {
        components: { ElButton, ElIcon, ElTag },
        stubs: ['MagicStick', 'Warning', 'Back', 'Opportunity', 'Loading', 'Monitor', 'Connection']
      }
    })

    await wrapper.find('button').trigger('click')
    
    // Check if fetch was called with correct arguments
    expect(global.fetch).toHaveBeenCalledTimes(1)
    const fetchArgs = global.fetch.mock.calls[0]
    expect(fetchArgs[0]).toBe('https://api.example.com/chat/completions')
    expect(fetchArgs[1].method).toBe('POST')
    expect(JSON.parse(fetchArgs[1].body).response_format).toEqual({ type: 'json_object' })

    // Wait for async operations to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()

    // Should render the principles title and the principle name
    expect(wrapper.text()).toContain('principlesTitle')
    expect(wrapper.text()).toContain('分割原理')
    expect(wrapper.text()).toContain('生物学')
  })

  it('handles API failure gracefully', async () => {
    store.structData = { techSystem: 'Drone', problem: 'Heavy battery' }
    localStorage.setItem('triz_api_config', JSON.stringify({
      apiKey: 'test-key',
      baseUrl: 'https://api.example.com',
      modelName: 'test-model'
    }))

    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    // Mock ElMessage.error
    const ElMessage = { error: vi.fn() }
    vi.doMock('element-plus', () => ({ ElMessage }))

    const wrapper = mount(CrossDomainInspiration, {
      global: {
        components: { ElButton, ElIcon, ElTag },
        stubs: ['MagicStick', 'Warning', 'Back', 'Opportunity', 'Loading', 'Monitor', 'Connection']
      }
    })

    await wrapper.find('button').trigger('click')
    
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Should still show waitTitle since generation failed
    expect(wrapper.text()).toContain('waitTitle')
  })
})
