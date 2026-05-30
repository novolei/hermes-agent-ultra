/**
 * TabContent — 标签内容渲染器
 *
 * 根据标签类型渲染参数化的 ChatView、AgentView 或 BrowserViewer。
 * 直接传递 sessionId/conversationId prop，无需桥接全局 atoms。
 *
 * Ported verbatim from uclaw ui/src/components/tabs/TabContent.tsx (Plan FB.c Wave D2)
 * Content stubs used for ChatView, BrowserPanel, SymphonyCanvas (not yet ported clusters).
 */

import * as React from 'react'
import { useAtomValue } from 'jotai'
import { visibleTabsAtom } from '@/features/chat-agent/atoms/tab-atoms'
import { ChatView } from '@/features/chat-agent/components/chat/chat-view-stub'
import { AgentView } from '@/features/chat-agent/components/agent/agent-view'
import { BrowserPanel } from '@/features/chat-agent/components/browser/browser-panel-stub'
import { SymphonyCanvas } from '@/features/chat-agent/lib/symphony-canvas-stub'
import { TabErrorBoundary } from './tab-error-boundary'

export interface TabContentProps {
  tabId: string
}

export function TabContent({ tabId }: TabContentProps): React.ReactElement {
  const tabs = useAtomValue(visibleTabsAtom)
  const tab = tabs.find((t) => t.id === tabId)

  // [FLASH-DEBUG] 监控 tab 查找失败（说明 tabId 指向了不存在的标签）
  React.useEffect(() => {
    if (!tab) {
      console.warn(`[FLASH-DEBUG] TabContent: tab not found for tabId="${tabId}"`, { tabIds: tabs.map(t => t.id) })
    }
  }, [tab, tabId, tabs])

  if (!tab) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        标签页不存在
      </div>
    )
  }

  if (tab.type === 'chat') {
    return (
      <TabErrorBoundary key={tab.sessionId} sessionId={tab.sessionId}>
        <ChatView conversationId={tab.sessionId} />
      </TabErrorBoundary>
    )
  }

  if (tab.type === 'browser') {
    return (
      <TabErrorBoundary key={tab.sessionId} sessionId={tab.sessionId}>
        <BrowserPanel agentSessionId={tab.sessionId} />
      </TabErrorBoundary>
    )
  }

  if (tab.type === 'symphony') {
    return (
      <TabErrorBoundary key={tab.sessionId} sessionId={tab.sessionId}>
        <SymphonyCanvas workflowId={tab.sessionId} />
      </TabErrorBoundary>
    )
  }

  return (
    <TabErrorBoundary key={tab.sessionId} sessionId={tab.sessionId}>
      <AgentView sessionId={tab.sessionId} />
    </TabErrorBoundary>
  )
}
