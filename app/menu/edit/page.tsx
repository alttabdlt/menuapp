import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const EditMenuItemClient = dynamic(() => import('./EditMenuItemClient'), { ssr: false })

export default function EditMenuItemPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditMenuItemClient />
    </Suspense>
  )
}