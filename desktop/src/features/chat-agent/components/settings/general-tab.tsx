/**
 * GeneralTab — composes GeneralSettings + PromptSettings + AppearanceSettings.
 */
import * as React from 'react'
import { GeneralSettings } from './general-settings'
import { PromptSettings } from './prompt-settings'
import { AppearanceSettings } from './appearance-settings'

export function GeneralTab(): React.ReactElement {
  return (
    <div className="space-y-8">
      <section data-settings-section="通用偏好">
        <GeneralSettings />
      </section>
      <section data-settings-section="系统提示词">
        <PromptSettings />
      </section>
      <section data-settings-section="主题与字体">
        <AppearanceSettings />
      </section>
    </div>
  )
}
