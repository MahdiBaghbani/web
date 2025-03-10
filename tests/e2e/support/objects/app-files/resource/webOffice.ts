import { Page, expect } from '@playwright/test'

const externalEditorIframe = '[name="app-iframe"]'
// Collabora
const collaboraDocPermissionModeSelector = '#permissionmode-container'
const collaboraEditorSaveSelector = '.notebookbar-shortcuts-bar #save'
const collaboraDocTextAreaSelector = '#clipboard-area'
const collaboraWelcomeModal = '.iframe-welcome-modal'
const collaboraCanvasEditorSelector = '.leaflet-layer'
// OnlyOffice
const onlyOfficeInnerFrameSelector = '[name="frameEditor"]'
const onlyOfficeSaveButtonSelector = '#slot-btn-dt-save > button'
const onlyofficeDocTextAreaSelector = '#area_id'
const onlyOfficeCanvasEditorSelector = '#id_viewer_overlay'
const copyPasteWarningPopup = '#copy_paste_warning-box'

export const removeCollaboraWelcomeModal = async (page: Page) => {
  const editorMainFrame = page.frameLocator(externalEditorIframe)
  await editorMainFrame.locator('#document-header').waitFor()
  const versionSet = await editorMainFrame.locator('body').evaluate(() => {
    return localStorage.getItem('WSDWelcomeVersion')
  })
  if (!versionSet) {
    await editorMainFrame.locator(collaboraWelcomeModal).waitFor()
    await page.keyboard.press('Escape')
  }
}

export const focusCollaboraEditor = async (page: Page) => {
  const editorMainFrame = page.frameLocator(externalEditorIframe)
  await editorMainFrame.locator(collaboraCanvasEditorSelector).click()
}

export const focusOnlyOfficeEditor = async (page: Page) => {
  const editorMainFrame = page.frameLocator(externalEditorIframe)
  const innerFrame = editorMainFrame.frameLocator(onlyOfficeInnerFrameSelector)
  await innerFrame.locator(onlyOfficeCanvasEditorSelector).click()
}

export const getOfficeDocumentContent = async (page: Page) => {
  // copying and getting the value with keyboard requires some time
  await page.keyboard.press('ControlOrMeta+A', { delay: 200 })
  await page.keyboard.press('ControlOrMeta+C', { delay: 200 })
  try {
    const editorMainFrame = page.frameLocator(externalEditorIframe)
    await editorMainFrame.locator(copyPasteWarningPopup).waitFor({ timeout: 1000 })
    console.log('copy-paste warning popup found...')
    // close popup
    await page.keyboard.press('Escape')
    // deselect text. otherwise the clipboard will be empty
    await page.keyboard.press('Escape')
    // select text again and copy text
    await page.keyboard.press('ControlOrMeta+A', { delay: 200 })
    await page.keyboard.press('ControlOrMeta+C', { delay: 200 })
  } catch {}
  return page.evaluate(() => navigator.clipboard.readText())
}

export const fillCollaboraDocumentContent = async (page: Page, content: string) => {
  await removeCollaboraWelcomeModal(page)

  const editorMainFrame = page.frameLocator(externalEditorIframe)
  await editorMainFrame.locator(collaboraDocTextAreaSelector).focus()
  await page.keyboard.press('ControlOrMeta+A')
  await editorMainFrame.locator(collaboraDocTextAreaSelector).fill(content)
  const saveLocator = editorMainFrame.locator(collaboraEditorSaveSelector)
  await expect(saveLocator).toHaveAttribute('class', /.*savemodified.*/)
  await saveLocator.click()
  await expect(saveLocator).not.toHaveAttribute('class', /.*savemodified.*/)
  // allow the document to save
  await page.waitForTimeout(500)
}

export const fillOnlyOfficeDocumentContent = async (page: Page, content: string) => {
  const editorMainFrame = page.frameLocator(externalEditorIframe)
  const innerIframe = editorMainFrame.frameLocator(onlyOfficeInnerFrameSelector)
  await innerIframe.locator(onlyofficeDocTextAreaSelector).focus()
  await page.keyboard.press('ControlOrMeta+A')
  await innerIframe.locator(onlyofficeDocTextAreaSelector).fill(content)
  const saveButtonDisabledLocator = innerIframe.locator(onlyOfficeSaveButtonSelector)
  await expect(saveButtonDisabledLocator).toHaveAttribute('disabled', 'disabled')
}

export const canEditCollaboraDocument = async (page: Page) => {
  const editorMainFrame = page.frameLocator(externalEditorIframe)
  const collaboraDocPermissionModeLocator = editorMainFrame.locator(
    collaboraDocPermissionModeSelector
  )
  const permissionMode = (await collaboraDocPermissionModeLocator.innerText()).trim()
  return permissionMode === 'Edit'
}

export const canEditOnlyOfficeDocument = async (page: Page) => {
  const editorMainFrame = page.frameLocator(externalEditorIframe)
  const innerFrame = editorMainFrame.frameLocator(onlyOfficeInnerFrameSelector)
  try {
    await expect(innerFrame.locator(onlyOfficeSaveButtonSelector)).toBeVisible()
    return true
  } catch {
    return false
  }
}
