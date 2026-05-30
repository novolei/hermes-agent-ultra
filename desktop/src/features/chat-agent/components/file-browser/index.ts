// Real barrel for the file-browser cluster.
// NOTE: uclaw's ui/src/components/file-browser/index.tsx is a [PLACEHOLDER] that
// shadows the real sibling components with stubs (a uclaw oversight). This barrel
// deliberately diverges by re-exporting the REAL ported components. (Plan FB.a Wave C3)
export { FileBrowser } from './file-browser'
export { FileDropZone } from './file-drop-zone'
export { FileTypeIcon } from './file-type-icon'
