// Web Worker for filtering products without blocking the main thread
self.onmessage = function(event) {
  const { products, searchQuery, selectedCategory, activeTab } = event.data
  
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
  
  self.postMessage({
    filteredProducts,
    stats: { totalProducts, addedToSite, totalRevenue, avgRating }
  })
}