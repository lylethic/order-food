'use client'

import authApiRequest from '@/apiRequests/auth'
import { useAppContext } from '@/app/app-provider'
import { usePathname, useRouter } from 'next/navigation'
import { Suspense, useEffect } from 'react'

function LogoutLogic() {
  const router = useRouter()
  const pathname = usePathname()
  const { setUser } = useAppContext()

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal
    authApiRequest
      .logoutFromNextClientToNextServer(true, signal)
      .then(() => {
        setUser(null)
        router.push(`/login?redirectFrom=${pathname}`)
      })
    return () => {
      controller.abort()
    }
  }, [router, pathname, setUser])
  return <div>page</div>
}

export default function LogoutPage() {
  return (
    <Suspense>
      <LogoutLogic />
    </Suspense>
  )
}
