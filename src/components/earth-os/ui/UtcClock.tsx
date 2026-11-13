'use client'

import { useEffect, useState } from 'react'

export function UtcClock() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const h = now.getUTCHours().toString().padStart(2, '0')
      const m = now.getUTCMinutes().toString().padStart(2, '0')
      const s = now.getUTCSeconds().toString().padStart(2, '0')
      setTime(`${h}:${m}:${s} UTC`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="eos-utc-clock" aria-label="Current UTC time">
      {time || '--:--:-- UTC'}
    </span>
  )
}
