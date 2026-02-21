'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface FadeInUpProps {
  children: ReactNode
  delay?: number
  className?: string
  once?: boolean
}

export function FadeInUp({ children, delay = 0, className, once = true }: FadeInUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once }}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
