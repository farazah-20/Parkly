import { cn } from '@/lib/utils'

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('w-full overflow-x-auto rounded-lg border border-gray-200', className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{children}</thead>
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-gray-100 bg-white">{children}</tbody>
}

export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn('hover:bg-gray-50 transition-colors', className)}>{children}</tr>
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn('px-4 py-3', className)}>{children}</th>
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 text-gray-700', className)}>{children}</td>
}
