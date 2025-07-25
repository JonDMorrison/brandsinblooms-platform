import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Grid3X3, 
  List, 
  Plus, 
  Filter,
  Package,
  ShoppingCart,
  DollarSign,
  Star
} from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { toast } from 'sonner'

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

// Mock product data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Rose Bouquet',
    description: 'Beautiful arrangement of 12 premium red roses with eucalyptus and baby\'s breath',
    price: 89.99,
    originalPrice: 99.99,
    rating: 4.8,
    reviews: 124,
    category: 'Bouquets',
    stock: 'in-stock',
    image: '/images/roses.jpg',
    featured: true,
    addedToSite: true
  },
  {
    id: '2',
    name: 'Seasonal Wildflower Mix',
    description: 'Fresh mix of seasonal wildflowers perfect for any occasion',
    price: 65.00,
    rating: 4.6,
    reviews: 89,
    category: 'Seasonal',
    stock: 'in-stock',
    image: '/images/wildflowers.jpg',
    featured: false,
    addedToSite: false
  },
  {
    id: '3',
    name: 'Elegant Lily Arrangement',
    description: 'Sophisticated arrangement featuring white lilies and greenery',
    price: 75.50,
    originalPrice: 85.00,
    rating: 4.9,
    reviews: 156,
    category: 'Arrangements',
    stock: 'low-stock',
    image: '/images/lilies.jpg',
    featured: true,
    addedToSite: true
  },
  {
    id: '4',
    name: 'Sunflower Celebration',
    description: 'Bright and cheerful sunflower bouquet with complementary flowers',
    price: 55.00,
    rating: 4.5,
    reviews: 67,
    category: 'Bouquets',
    stock: 'in-stock',
    image: '/images/sunflowers.jpg',
    featured: false,
    addedToSite: false
  },
  {
    id: '5',
    name: 'Wedding Centerpiece',
    description: 'Elegant centerpiece arrangement perfect for weddings and special events',
    price: 120.00,
    rating: 4.7,
    reviews: 45,
    category: 'Wedding',
    stock: 'out-of-stock',
    image: '/images/centerpiece.jpg',
    featured: false,
    addedToSite: false
  },
  {
    id: '6',
    name: 'Spring Garden Mix',
    description: 'Fresh spring flowers including tulips, daffodils, and hyacinths',
    price: 45.00,
    rating: 4.4,
    reviews: 78,
    category: 'Seasonal',
    stock: 'in-stock',
    image: '/images/spring.jpg',
    featured: false,
    addedToSite: true
  }
]

const categories = ['All', 'Bouquets', 'Arrangements', 'Seasonal', 'Wedding']

export default function Products() {
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [activeTab, setActiveTab] = useState('catalogue')

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
    const matchesTab = activeTab === 'catalogue' || 
                      (activeTab === 'my-products' && product.addedToSite)
    
    return matchesSearch && matchesCategory && matchesTab
  })

  const handleAddToSite = (productId: string) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, addedToSite: true } : p
    ))
    toast.success('Product added to your site!')
  }

  const handleRemoveFromSite = (productId: string) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, addedToSite: false } : p
    ))
    toast.success('Product removed from your site!')
  }

  // Calculate stats
  const totalProducts = products.length
  const addedToSite = products.filter(p => p.addedToSite).length
  const totalRevenue = products
    .filter(p => p.addedToSite)
    .reduce((sum, p) => sum + p.price, 0)
  const avgRating = products.reduce((sum, p) => sum + p.rating, 0) / products.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog and site products</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add New Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-md">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-xl font-bold">{totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-md">
                <ShoppingCart className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">On Site</p>
                <p className="text-xl font-bold">{addedToSite}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-md">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-md">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-xl font-bold">{avgRating.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="catalogue">Product Catalogue</TabsTrigger>
              <TabsTrigger value="my-products">My Products ({addedToSite})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search products..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}>
                  <ToggleGroupItem value="grid" aria-label="Grid view">
                    <Grid3X3 className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="List view">
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Products Grid/List */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No products found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || selectedCategory !== 'All'
                      ? 'Try adjusting your search or filters'
                      : 'Start by adding your first product'
                    }
                  </p>
                </div>
              ) : (
                <div className={
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                    : 'space-y-4'
                }>
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      viewMode={viewMode}
                      onAddToSite={handleAddToSite}
                      onRemoveFromSite={handleRemoveFromSite}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}