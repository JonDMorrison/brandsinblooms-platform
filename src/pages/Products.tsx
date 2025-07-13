import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Search,
  Filter,
  Plus,
  Heart,
  Star,
  ShoppingBag,
  Eye,
  Grid3X3,
  List
} from 'lucide-react';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock product catalogue data
  const allProducts = [
    {
      id: 1,
      name: 'Vintage Ceramic Vase',
      price: 89.99,
      originalPrice: 120.00,
      category: 'decor',
      image: '/api/placeholder/300/300',
      rating: 4.8,
      reviews: 124,
      inStock: true,
      onMySite: true,
      description: 'Beautiful handcrafted ceramic vase perfect for modern homes.',
    },
    {
      id: 2,
      name: 'Minimalist Wall Art',
      price: 45.99,
      originalPrice: 65.00,
      category: 'art',
      image: '/api/placeholder/300/300',
      rating: 4.6,
      reviews: 89,
      inStock: true,
      onMySite: false,
      description: 'Contemporary abstract wall art to elevate any space.',
    },
    {
      id: 3,
      name: 'Luxury Throw Blanket',
      price: 129.99,
      originalPrice: 180.00,
      category: 'textiles',
      image: '/api/placeholder/300/300',
      rating: 4.9,
      reviews: 256,
      inStock: true,
      onMySite: true,
      description: 'Soft cashmere blend throw blanket for ultimate comfort.',
    },
    {
      id: 4,
      name: 'Modern Table Lamp',
      price: 199.99,
      originalPrice: 299.00,
      category: 'lighting',
      image: '/api/placeholder/300/300',
      rating: 4.7,
      reviews: 178,
      inStock: false,
      onMySite: false,
      description: 'Sleek LED table lamp with adjustable brightness.',
    },
    {
      id: 5,
      name: 'Artisan Coffee Table',
      price: 449.99,
      originalPrice: 599.00,
      category: 'furniture',
      image: '/api/placeholder/300/300',
      rating: 4.8,
      reviews: 92,
      inStock: true,
      onMySite: true,
      description: 'Handcrafted solid wood coffee table with unique grain patterns.',
    },
    {
      id: 6,
      name: 'Designer Cushion Set',
      price: 79.99,
      originalPrice: 110.00,
      category: 'textiles',
      image: '/api/placeholder/300/300',
      rating: 4.5,
      reviews: 203,
      inStock: true,
      onMySite: false,
      description: 'Set of 4 decorative cushions with premium fabric.',
    },
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'decor', label: 'Home Decor' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'lighting', label: 'Lighting' },
    { value: 'textiles', label: 'Textiles' },
    { value: 'art', label: 'Wall Art' },
  ];

  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const myProducts = allProducts.filter(product => product.onMySite);

  const toggleProductOnSite = (productId: number) => {
    // Mock function to toggle product on/off site
    console.log(`Toggle product ${productId} on site`);
  };

  const ProductCard = ({ product, compact = false }: { product: any; compact?: boolean }) => (
    <Card className={`interactive hover:shadow-glow transition-all duration-300 ${compact ? 'h-full' : ''}`}>
      <div className="relative">
        <div className="aspect-square bg-gradient-card rounded-t-lg p-4 flex items-center justify-center">
          <Package className="h-16 w-16 text-muted-foreground" />
        </div>
        {product.onMySite && (
          <Badge className="absolute top-2 right-2 bg-success">
            On My Site
          </Badge>
        )}
        {!product.inStock && (
          <Badge className="absolute top-2 left-2 bg-destructive">
            Out of Stock
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(product.rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.reviews})
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg">${product.price}</span>
            {product.originalPrice > product.price && (
              <span className="text-sm text-muted-foreground line-through">
                ${product.originalPrice}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        </div>
        <div className="mt-4 flex space-x-2">
          <Button
            size="sm"
            variant={product.onMySite ? "outline" : "gradient"}
            className="flex-1"
            onClick={() => toggleProductOnSite(product.id)}
            disabled={!product.inStock}
          >
            {product.onMySite ? (
              <>
                <Eye className="mr-1 h-3 w-3" />
                Remove
              </>
            ) : (
              <>
                <Plus className="mr-1 h-3 w-3" />
                Add to Site
              </>
            )}
          </Button>
          <Button size="sm" variant="ghost">
            <Heart className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-muted-foreground">
            Browse and manage products for your site
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="gradient-card border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Products on Site</p>
                <p className="text-2xl font-bold">{myProducts.length}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="gradient-card border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Catalogue</p>
                <p className="text-2xl font-bold">{allProducts.length}</p>
              </div>
              <Package className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card className="gradient-card border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categories.length - 1}</p>
              </div>
              <Filter className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="gradient-card border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Rating</p>
                <p className="text-2xl font-bold">4.7</p>
              </div>
              <Star className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="catalogue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="catalogue">Product Catalogue</TabsTrigger>
          <TabsTrigger value="my-products">My Products ({myProducts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="catalogue" className="space-y-4">
          {/* Filters */}
          <Card className="gradient-card border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} compact={viewMode === 'grid'} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-products" className="space-y-4">
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {myProducts.map((product) => (
              <ProductCard key={product.id} product={product} compact={viewMode === 'grid'} />
            ))}
          </div>
          {myProducts.length === 0 && (
            <Card className="gradient-card border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products added yet</h3>
                <p className="text-muted-foreground mb-4">
                  Browse the catalogue and add products to your site
                </p>
                <Button variant="gradient">
                  Browse Catalogue
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Products;