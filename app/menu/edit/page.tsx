'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import EditMenuItemForm from '../../../components/EditMenuItemForm'

function EditMenuItemContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  return <EditMenuItemForm id={id} />
}

export default function EditMenuItemPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditMenuItemContent />
    </Suspense>
  )
}
