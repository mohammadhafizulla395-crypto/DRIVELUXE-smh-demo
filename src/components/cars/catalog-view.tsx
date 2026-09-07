'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, X, Car as CarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CarCard } from './car-card'
import { CarGridSkeleton } from '@/components/shared/skeletons'
import { carsApi, type CarQuery } from '@/lib/api'
import { carTypes, transmissions, fuels } from '@/lib/validations'
import type { Car, Pagination } from '@/types'
import { cn } from '@/lib/utils'

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
]

export function CatalogView() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [type, setType] = useState('all')
  const [transmission, setTransmission] = useState('all')
  const [fuel, setFuel] = useState('all')
  const [maxPrice, setMaxPrice] = useState('1000')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const [cars, setCars] = useState<Car[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loadedKey, setLoadedKey] = useState('')

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const query: CarQuery = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      type: type !== 'all' ? type : undefined,
      transmission: transmission !== 'all' ? transmission : undefined,
      fuel: fuel !== 'all' ? fuel : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort,
      page,
      limit: 9,
    }),
    [debouncedSearch, type, transmission, fuel, maxPrice, sort, page],
  )

  const queryKey = JSON.stringify(query)
  const loading = loadedKey !== queryKey

  useEffect(() => {
    let active = true
    carsApi
      .list(query)
      .then((res) => {
        if (!active) return
        setCars(res.cars)
        setPagination(res.pagination)
        setLoadedKey(queryKey)
      })
      .catch(() => {
        if (!active) return
        setCars([])
        setPagination(null)
        setLoadedKey(queryKey)
      })
    return () => {
      active = false
    }
  }, [query, queryKey])

  const resetFilters = () => {
    setType('all')
    setTransmission('all')
    setFuel('all')
    setMaxPrice('1000')
    setSort('newest')
    setSearch('')
    setPage(1)
  }

  const activeFilterCount =
    (type !== 'all' ? 1 : 0) +
    (transmission !== 'all' ? 1 : 0) +
    (fuel !== 'all' ? 1 : 0) +
    (maxPrice && maxPrice !== '1000' ? 1 : 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
      {/* header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Explore the fleet
        </h1>
        <p className="text-muted-foreground mt-2">
          {pagination
            ? `${pagination.total} vehicle${pagination.total === 1 ? '' : 's'} available`
            : 'Browse our curated collection of premium vehicles.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        {/* Filters — desktop sidebar */}
        <aside className="hidden lg:block">
          <FilterPanel
            type={type}
            setType={(v) => {
              setType(v)
              setPage(1)
            }}
            transmission={transmission}
            setTransmission={(v) => {
              setTransmission(v)
              setPage(1)
            }}
            fuel={fuel}
            setFuel={(v) => {
              setFuel(v)
              setPage(1)
            }}
            maxPrice={maxPrice}
            setMaxPrice={(v) => {
              setMaxPrice(v)
              setPage(1)
            }}
            onReset={resetFilters}
            activeCount={activeFilterCount}
          />
        </aside>

        {/* Main */}
        <div>
          {/* toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or brand..."
                className="pl-9 bg-background/50"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="lg:hidden"
                onClick={() => setShowFilters(true)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 bg-primary text-primary-foreground">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[180px] bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* grid */}
          {loading ? (
            <CarGridSkeleton count={9} />
          ) : cars.length === 0 ? (
            <EmptyState onReset={resetFilters} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {cars.map((car, i) => (
                  <CarCard key={car.id} car={car} index={i} />
                ))}
              </div>

              {/* pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() =>
                      setPage((p) => Math.min(pagination.totalPages, p + 1))
                    }
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filters sheet (inline drawer via simple fixed panel) */}
      {showFilters && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute right-0 top-0 h-full w-[300px] bg-background border-l border-white/10 p-5 overflow-y-auto scroll-dark"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold">Filters</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <FilterPanel
              type={type}
              setType={(v) => {
                setType(v)
                setPage(1)
              }}
              transmission={transmission}
              setTransmission={(v) => {
                setTransmission(v)
                setPage(1)
              }}
              fuel={fuel}
              setFuel={(v) => {
                setFuel(v)
                setPage(1)
              }}
              maxPrice={maxPrice}
              setMaxPrice={(v) => {
                setMaxPrice(v)
                setPage(1)
              }}
              onReset={resetFilters}
              activeCount={activeFilterCount}
            />
            <Button
              className="w-full mt-6 bg-primary text-primary-foreground"
              onClick={() => setShowFilters(false)}
            >
              Show results
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function FilterPanel({
  type,
  setType,
  transmission,
  setTransmission,
  fuel,
  setFuel,
  maxPrice,
  setMaxPrice,
  onReset,
  activeCount,
}: {
  type: string
  setType: (v: string) => void
  transmission: string
  setTransmission: (v: string) => void
  fuel: string
  setFuel: (v: string) => void
  maxPrice: string
  setMaxPrice: (v: string) => void
  onReset: () => void
  activeCount: number
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          Filters
        </h3>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="text-xs text-primary hover:underline"
          >
            Reset ({activeCount})
          </button>
        )}
      </div>

      <FilterGroup label="Car type">
        <div className="flex flex-wrap gap-2">
          <Chip active={type === 'all'} onClick={() => setType('all')}>
            All
          </Chip>
          {carTypes.map((t) => (
            <Chip key={t} active={type === t} onClick={() => setType(t)}>
              {t}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="Transmission">
        <div className="flex flex-wrap gap-2">
          <Chip active={transmission === 'all'} onClick={() => setTransmission('all')}>
            All
          </Chip>
          {transmissions.map((t) => (
            <Chip key={t} active={transmission === t} onClick={() => setTransmission(t)}>
              {t}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="Fuel">
        <div className="flex flex-wrap gap-2">
          <Chip active={fuel === 'all'} onClick={() => setFuel('all')}>
            All
          </Chip>
          {fuels.map((f) => (
            <Chip key={f} active={fuel === f} onClick={() => setFuel(f)}>
              {f}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label={`Max price: $${maxPrice}/day`}>
        <input
          type="range"
          min={50}
          max={1000}
          step={50}
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>$50</span>
          <span>$1000+</span>
        </div>
      </FilterGroup>
    </div>
  )
}

function FilterGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20',
      )}
    >
      {children}
    </button>
  )
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-20">
      <div className="grid place-items-center h-16 w-16 rounded-full bg-muted/30 mx-auto mb-4">
        <CarIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">No cars match your filters</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Try widening your search or resetting the filters.
      </p>
      <Button variant="outline" onClick={onReset}>
        Reset filters
      </Button>
    </div>
  )
}
