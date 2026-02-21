'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface KPIItem {
  label: string
  value: string | number
  icon:  LucideIcon
  color: string
  bg:    string
}

interface AnimatedKPIGridProps {
  items: KPIItem[]
}

export function AnimatedKPIGrid({ items }: AnimatedKPIGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ label, value, icon: Icon, color, bg }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.08, ease: [0.21, 0.47, 0.32, 0.98] }}
          whileHover={{ y: -2 }}
        >
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <motion.div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Icon className={`h-5 w-5 ${color}`} />
              </motion.div>
              <div>
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <motion.p
                  className="text-xl font-bold text-gray-900"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.08 + 0.2 }}
                >
                  {value}
                </motion.p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
