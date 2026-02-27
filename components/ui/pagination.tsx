import * as React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange?: (page: number) => void
} & React.ComponentProps<'nav'>

const createPageList = (current: number, total: number) => {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const pages: (number | 'ellipsis')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) {
    pages.push('ellipsis')
  }

  for (let i = start; i <= end; i += 1) {
    pages.push(i)
  }

  if (end < total - 1) {
    pages.push('ellipsis')
  }

  pages.push(total)
  return pages
}

function Pagination({
  className,
  currentPage,
  totalPages,
  onPageChange,
  ...rest
}: PaginationProps) {
  const pages = React.useMemo(
    () => createPageList(currentPage, Math.max(totalPages, 1)),
    [currentPage, totalPages]
  )

  const handleChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return
    }
    onPageChange?.(page)
  }

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('mx-auto flex w-full items-center justify-between gap-4 flex-wrap', className)}
      {...rest}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="gap-2"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      <div className="flex items-center gap-2">
        {pages.map((page, index) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={page}
              type="button"
              variant={page === currentPage ? 'default' : 'outline'}
              size="icon"
              onClick={() => handleChange(page)}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </Button>
          )
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="gap-2"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </nav>
  )
}

export { Pagination }
