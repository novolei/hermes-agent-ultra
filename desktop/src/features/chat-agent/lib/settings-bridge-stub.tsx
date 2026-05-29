import * as React from 'react'

function makeStubTab(symbol: string, plan: string) {
  return function StubSettingsTab(): React.ReactElement {
    return (
      <div
        data-stub={symbol}
        data-deferred-to={plan}
        className="p-8 text-center text-muted-foreground"
      >
        <div className="text-lg font-medium mb-2">{symbol}</div>
        <p className="text-sm">This settings tab is deferred to Plan {plan}.</p>
      </div>
    )
  }
}

// Plan 3.5.s.b — intelligence + memory + shortcuts
export const IntelligenceTab = makeStubTab('IntelligenceTab', '3.5.s.b')
export const MemoryRecallTab = makeStubTab('MemoryRecallTab', '3.5.s.b')
export const LearnedProfileTab = makeStubTab('LearnedProfileTab', '3.5.s.b')
export const ShortcutSettings = makeStubTab('ShortcutSettings', '3.5.s.b')

// Plan 3.5.s.c — provider integrations + STT settings + pet + browser runtime
export const SttSettings = makeStubTab('SttSettings', '3.5.s.c')
export const ImChannelsSettings = makeStubTab('ImChannelsSettings', '3.5.s.c')
export const PetSettings = makeStubTab('PetSettings', '3.5.s.c')
export const BrowserRuntimeSettings = makeStubTab('BrowserRuntimeSettings', '3.5.s.c')

// Plan 3.5.s.d — advanced + system
export const ProxySetting = makeStubTab('ProxySetting', '3.5.s.d')
export const SystemTab = makeStubTab('SystemTab', '3.5.s.d')
export const AboutSettings = makeStubTab('AboutSettings', '3.5.s.d')
