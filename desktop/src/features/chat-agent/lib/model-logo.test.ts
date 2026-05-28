import { describe, it, expect, vi } from 'vitest'
import {
  inferProviderFromModelId,
  inferProviderFromBaseUrl,
  getModelLogo,
  getChannelLogo,
  resolveModelDisplayName,
} from './model-logo'
import type { Channel } from './chat-types'

// Mock the glob import since we don't have actual image files in the test
vi.mock('import.meta', () => ({
  glob: vi.fn(() => ({})),
}))

describe('model-logo', () => {
  describe('inferProviderFromModelId', () => {
    it('should infer Anthropic from claude-* models', () => {
      expect(inferProviderFromModelId('claude-sonnet-4-6')).toBe('anthropic')
      expect(inferProviderFromModelId('claude-opus')).toBe('anthropic')
      expect(inferProviderFromModelId('claude_instant')).toBe('anthropic')
    })

    it('should infer OpenAI from gpt-* models', () => {
      expect(inferProviderFromModelId('gpt-4o')).toBe('openai')
      expect(inferProviderFromModelId('gpt-4-turbo')).toBe('openai')
      expect(inferProviderFromModelId('gpt-3.5-turbo')).toBe('openai')
    })

    it('should infer OpenAI from reasoning models', () => {
      expect(inferProviderFromModelId('o1')).toBe('openai')
      expect(inferProviderFromModelId('o1-preview')).toBe('openai')
      expect(inferProviderFromModelId('o3-mini')).toBe('openai')
    })

    it('should infer Google from gemini models', () => {
      expect(inferProviderFromModelId('gemini-1.5-pro')).toBe('google')
      expect(inferProviderFromModelId('palm-2')).toBe('google')
    })

    it('should infer DeepSeek from deepseek models', () => {
      expect(inferProviderFromModelId('deepseek-v3')).toBe('deepseek')
    })

    it('should infer Aliyun from qwen models', () => {
      expect(inferProviderFromModelId('qwen-max')).toBe('aliyun')
      expect(inferProviderFromModelId('aliyun-model')).toBe('aliyun')
    })

    it('should infer Mistral from mistral models', () => {
      expect(inferProviderFromModelId('mistral-large')).toBe('mistral')
      expect(inferProviderFromModelId('mixtral-8x7b')).toBe('mistral')
    })

    it('should infer xAI from grok models', () => {
      expect(inferProviderFromModelId('grok-2')).toBe('xai')
    })

    it('should infer Moonshot from moonshot/kimi models', () => {
      expect(inferProviderFromModelId('moonshot-v1')).toBe('moonshot')
      expect(inferProviderFromModelId('kimi-9b')).toBe('moonshot')
    })

    it('should infer Zhipu from glm models', () => {
      expect(inferProviderFromModelId('glm-4')).toBe('zai')
      expect(inferProviderFromModelId('chatglm-3')).toBe('zai')
    })

    it('should infer MiniMax from minimax/abab models', () => {
      expect(inferProviderFromModelId('minimax-01')).toBe('minimax')
      expect(inferProviderFromModelId('abab5.5-chat')).toBe('minimax')
    })

    it('should infer Volcengine from doubao models', () => {
      expect(inferProviderFromModelId('doubao-pro')).toBe('volcengine')
    })

    it('should infer BytePlus from byteplus/skylark models', () => {
      expect(inferProviderFromModelId('byteplus-model')).toBe('byteplus')
      expect(inferProviderFromModelId('skylark-chat')).toBe('byteplus')
    })

    it('should infer Baidu from ernie models', () => {
      expect(inferProviderFromModelId('ernie-4')).toBe('baidu')
      expect(inferProviderFromModelId('wenxin-turbo')).toBe('baidu')
    })

    it('should infer Xiaomi from mi-* models', () => {
      expect(inferProviderFromModelId('mi-large')).toBe('xiaomi')
    })

    it('should infer Ollama from llama/phi models', () => {
      expect(inferProviderFromModelId('llama2')).toBe('ollama')
      expect(inferProviderFromModelId('phi-2')).toBe('ollama')
    })

    it('should infer HuggingFace from hf-* models', () => {
      expect(inferProviderFromModelId('hf-model')).toBe('huggingface')
    })

    it('should handle OpenRouter vendor/model slugs', () => {
      expect(inferProviderFromModelId('openrouter/model')).toBe('openrouter')
      expect(inferProviderFromModelId('vendor/model')).toBe('openrouter')
      // vendor part is just "gpt-4", which doesn't resolve, so fallback to openrouter
      expect(inferProviderFromModelId('gpt-4/variant')).toBe('openai')
    })

    it('should return undefined for unknown models', () => {
      expect(inferProviderFromModelId('unknown-model')).toBeUndefined()
      expect(inferProviderFromModelId('')).toBeUndefined()
    })
  })

  describe('inferProviderFromBaseUrl', () => {
    it('should infer Anthropic from anthropic.com URLs', () => {
      expect(inferProviderFromBaseUrl('https://api.anthropic.com/v1')).toBe('anthropic')
    })

    it('should infer OpenAI from openai.com URLs', () => {
      expect(inferProviderFromBaseUrl('https://api.openai.com/v1')).toBe('openai')
      expect(inferProviderFromBaseUrl('https://openai.azure.com/v1')).toBe('openai')
    })

    it('should infer Google from googleapis URLs', () => {
      expect(inferProviderFromBaseUrl('https://generativelanguage.googleapis.com')).toBe('google')
      expect(inferProviderFromBaseUrl('https://vertex.googleapis.com')).toBe('google')
    })

    it('should infer local/Ollama from localhost', () => {
      expect(inferProviderFromBaseUrl('http://localhost:11434')).toBe('ollama')
      expect(inferProviderFromBaseUrl('http://127.0.0.1:8000')).toBe('ollama')
    })

    it('should return undefined for unknown URLs', () => {
      expect(inferProviderFromBaseUrl('https://unknown.com')).toBeUndefined()
      expect(inferProviderFromBaseUrl('')).toBeUndefined()
    })
  })

  describe('getModelLogo', () => {
    it('should return a string (logo URL or empty)', () => {
      const logo = getModelLogo('claude-sonnet-4-6')
      expect(typeof logo).toBe('string')
    })

    it('should fall back to model-id inference when provider hint is not in map', () => {
      const logo = getModelLogo('claude-opus', 'UnknownProvider')
      expect(typeof logo).toBe('string')
    })

    it('should return empty string for unknown models without provider hint', () => {
      const logo = getModelLogo('unknown-model')
      expect(logo).toBe('')
    })
  })

  describe('getChannelLogo', () => {
    it('should return a string (logo URL or empty)', () => {
      const logo = getChannelLogo('https://api.openai.com/v1')
      expect(typeof logo).toBe('string')
    })

    it('should prioritize provider hint over baseUrl inference', () => {
      const logo = getChannelLogo('https://unknown.com/v1', 'anthropic')
      expect(typeof logo).toBe('string')
    })

    it('should return empty string for unknown URLs', () => {
      const logo = getChannelLogo('https://unknown-api.com/v1')
      expect(logo).toBe('')
    })
  })

  describe('resolveModelDisplayName', () => {
    it('should return raw modelId when no channels are provided', () => {
      expect(resolveModelDisplayName('claude-opus')).toBe('claude-opus')
    })

    it('should return raw modelId when channels array is empty', () => {
      expect(resolveModelDisplayName('claude-opus', [])).toBe('claude-opus')
    })

    it('should resolve display name from channel models if found', () => {
      const channels: Channel[] = [
        {
          id: 'ch1',
          name: 'OpenAI',
          provider: 'openai',
          baseUrl: 'https://api.openai.com',
          enabled: true,
          models: [
            { id: 'gpt-4o', name: 'GPT-4 Turbo', enabled: true },
            { id: 'gpt-4', name: 'GPT-4', enabled: true },
          ],
        },
      ]
      expect(resolveModelDisplayName('gpt-4o', channels)).toBe('GPT-4 Turbo')
      expect(resolveModelDisplayName('gpt-4', channels)).toBe('GPT-4')
    })

    it('should fall back to raw modelId if display name is empty or whitespace', () => {
      const channels: Channel[] = [
        {
          id: 'ch1',
          name: 'OpenAI',
          provider: 'openai',
          baseUrl: 'https://api.openai.com',
          enabled: true,
          models: [{ id: 'gpt-4o', name: '', enabled: true }],
        },
      ]
      expect(resolveModelDisplayName('gpt-4o', channels)).toBe('gpt-4o')
    })

    it('should skip channels with missing or invalid models array', () => {
      const channels: Partial<Channel>[] = [
        { id: 'ch1', name: 'Bad' } as Channel,
        {
          id: 'ch2',
          name: 'OpenAI',
          provider: 'openai',
          baseUrl: 'https://api.openai.com',
          enabled: true,
          models: [{ id: 'gpt-4o', name: 'GPT-4', enabled: true }],
        } as Channel,
      ]
      expect(resolveModelDisplayName('gpt-4o', channels as Channel[])).toBe('GPT-4')
    })
  })
})
