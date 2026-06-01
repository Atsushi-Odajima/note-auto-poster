'use client'
import { useEffect } from 'react'

export function ScrollResetOnMount() {
  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollLeft = 0
    document.body.scrollLeft = 0
  }, [])
  return null
}
