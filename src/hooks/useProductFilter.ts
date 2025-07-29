import { useEffect, useRef, useState } from 'react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  rating: number
  reviews: number
  category: string
  stock: 'in-stock' | 'low-stock' | 'out-of-stock'
  image: string
  featured: boolean
  addedToSite: boolean
}

interface FilterParams {
  products: Product[]
  searchQuery: string
  selectedCategory: string
  activeTab: string
}

interface FilterResult {
  filteredProducts: Product[]
  stats: {
    totalProducts: number
    addedToSite: number
    totalRevenue: number
    avgRating: number
  }
}

export function useProductFilter({
  products,
  searchQuery,
  selectedCategory,
  activeTab,
}: FilterParams) {
  const [result, setResult] = useState<FilterResult>({
    filteredProducts: products,
    stats: {
      totalProducts: products.length,
      addedToSite: 0,
      totalRevenue: 0,
      avgRating: 0,
    },
  })
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    // Check if Web Workers are supported
    if (typeof Worker !== 'undefined' && !workerRef.current) {
      workerRef.current = new Worker('/product-filter.worker.js')
      
      workerRef.current.onmessage = (event: MessageEvent<FilterResult>) => {
        setResult(event.data)
      }
    }

    // Use Web Worker if available, otherwise fall back to main thread
    if (workerRef.current) {
      workerRef.current.postMessage({
        products,
        searchQuery,
        selectedCategory,
        activeTab,
      })
    } else {
      // Fallback to synchronous filtering
      const searchLower = searchQuery.toLowerCase()
      const filteredProducts = products.filter(product => {
        const matchesSearch = !searchQuery || 
                             product.name.toLowerCase().includes(searchLower) ||
                             product.description.toLowerCase().includes(searchLower)
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
        const matchesTab = activeTab === 'catalogue' || 
                          (activeTab === 'my-products' && product.addedToSite)
        
        return matchesSearch && matchesCategory && matchesTab
      })
      
      // Calculate stats
      const totalProducts = products.length
      const siteProducts = products.filter(p => p.addedToSite)
      const addedToSite = siteProducts.length
      const totalRevenue = siteProducts.reduce((sum, p) => sum + p.price, 0)
      const avgRating = totalProducts > 0 
        ? products.reduce((sum, p) => sum + p.rating, 0) / totalProducts 
        : 0
      
      setResult({
        filteredProducts,
        stats: { totalProducts, addedToSite, totalRevenue, avgRating }
      })
    }
  }, [products, searchQuery, selectedCategory, activeTab])

  useEffect(() => {
    // Cleanup worker on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, [])

  return result
}