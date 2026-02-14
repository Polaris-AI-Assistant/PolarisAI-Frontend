'use client'

import { useEffect, useRef } from 'react'
import { getStoredUser } from '../lib/auth'

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void | Promise<void>>
  }
}

const ONESIGNAL_APP_ID = 'b7183f15-ca65-4068-989e-1904e0b53035'

/**
 * OneSignalInit
 * 
 * Loads the OneSignal SDK and logs in the user for targeted push notifications.
 * Place this component inside the root layout so it runs on every page.
 */
export default function OneSignalInit() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Load OneSignal SDK script
    if (typeof window !== 'undefined' && !document.getElementById('onesignal-sdk')) {
      const script = document.createElement('script')
      script.id = 'onesignal-sdk'
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
      script.defer = true
      document.head.appendChild(script)
    }

    // Initialize OneSignal
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true, // for local dev
        notifyButton: {
          enable: false, // we handle our own UI
        },
        serviceWorkerParam: { scope: '/' },
        promptOptions: {
          slidedown: {
            prompts: [
              {
                type: 'push',
                autoPrompt: true,
                text: {
                  actionMessage: 'Polaris would like to send you scheduled reminders and notifications.',
                  acceptButton: 'Allow',
                  cancelButton: 'Later',
                },
                delay: { pageViews: 1, timeDelay: 3 },
              },
            ],
          },
        },
      })

      // Request permission explicitly if not already granted
      const permission = await OneSignal.Notifications.permission
      if (!permission) {
        try {
          await OneSignal.Slidedown.promptPush()
        } catch (err) {
          console.warn('[OneSignal] Permission prompt error:', err)
        }
      }

      // If user is logged in, link their Supabase user ID to OneSignal
      const user = getStoredUser()
      if (user?.id) {
        try {
          await OneSignal.login(user.id)
          console.log('[OneSignal] Logged in user:', user.id)
        } catch (err) {
          console.warn('[OneSignal] Login error:', err)
        }
      }
    })
  }, [])

  return null // This component renders nothing
}
