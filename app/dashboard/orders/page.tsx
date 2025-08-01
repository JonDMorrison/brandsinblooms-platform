'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Badge } from '@/src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { 
  Search, 
  Filter,
  MoreHorizontal,
  Eye,
  Truck,
  RefreshCw,
  Download,
  Users,
  Calendar,
  Mail
} from 'lucide-react'
import { OrderStatusBadge } from '@/src/components/OrderStatusBadge'
import { OrderStats } from '@/src/components/OrderStats'
import { toast } from 'sonner'

interface Order {
  id: string
  customerName: string
  customerEmail: string
  orderDate: Date
  status: 'delivered' | 'shipped' | 'processing' | 'cancelled'
  total: number
  items: number
}

interface Customer {
  id: string
  name: string
  email: string
  orders: number
  totalSpent: number
  lastOrder: Date
  status: 'active' | 'inactive'
}

// Mock order data
const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah@example.com',
    orderDate: new Date('2024-01-20'),
    status: 'delivered',
    total: 89.99,
    items: 2
  },
  {
    id: 'ORD-002',
    customerName: 'Mike Chen',
    customerEmail: 'mike@example.com',
    orderDate: new Date('2024-01-19'),
    status: 'shipped',
    total: 145.50,
    items: 3
  },
  {
    id: 'ORD-003',
    customerName: 'Emily Davis',
    customerEmail: 'emily@example.com',
    orderDate: new Date('2024-01-18'),
    status: 'processing',
    total: 67.25,
    items: 1
  },
  {
    id: 'ORD-004',
    customerName: 'James Wilson',
    customerEmail: 'james@example.com',
    orderDate: new Date('2024-01-17'),
    status: 'delivered',
    total: 234.00,
    items: 4
  },
  {
    id: 'ORD-005',
    customerName: 'Lisa Anderson',
    customerEmail: 'lisa@example.com',
    orderDate: new Date('2024-01-16'),
    status: 'cancelled',
    total: 78.99,
    items: 2
  },
  {
    id: 'ORD-006',
    customerName: 'David Brown',
    customerEmail: 'david@example.com',
    orderDate: new Date('2024-01-15'),
    status: 'processing',
    total: 123.75,
    items: 3
  }
]

// Mock customer data derived from orders
const mockCustomers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    orders: 3,
    totalSpent: 267.50,
    lastOrder: new Date('2024-01-20'),
    status: 'active'
  },
  {
    id: 'CUST-002',
    name: 'Mike Chen',
    email: 'mike@example.com',
    orders: 2,
    totalSpent: 245.50,
    lastOrder: new Date('2024-01-19'),
    status: 'active'
  },
  {
    id: 'CUST-003',
    name: 'Emily Davis',
    email: 'emily@example.com',
    orders: 1,
    totalSpent: 67.25,
    lastOrder: new Date('2024-01-18'),
    status: 'active'
  },
  {
    id: 'CUST-004',
    name: 'James Wilson',
    email: 'james@example.com',
    orders: 5,
    totalSpent: 834.00,
    lastOrder: new Date('2024-01-17'),
    status: 'active'
  }
]

const statusOptions = ['All', 'processing', 'shipped', 'delivered', 'cancelled']

export default function OrdersPage() {
  const [orders] = useState<Order[]>(mockOrders)
  const [customers] = useState<Customer[]>(mockCustomers)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [activeTab, setActiveTab] = useState('orders')
  
  // Pagination state for orders (mock implementation)
  const hasNextPage = false
  const fetchNextPage = () => {
    // Mock implementation - would be replaced with real data fetching
    console.log('Fetching next page...')
  }
  const isFetchingNextPage = false

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
  })

  const handleStatusUpdate = (orderId: string, newStatus: Order['status']) => {
    toast.success(`Order ${orderId} status updated to ${newStatus}`)
  }

  const handleViewOrder = (orderId: string) => {
    toast.info(`Viewing order ${orderId}`)
  }

  const handleExportOrders = () => {
    toast.success('Orders exported to CSV')
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 fade-in-up" style={{ animationDelay: '0s' }}>
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage your orders and customer information</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportOrders}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Order Statistics */}
      <OrderStats orders={orders} />

      {/* Main Content */}
      <Card className="fade-in-up" style={{ animationDelay: '1.2s' }}>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
              <TabsTrigger value="customers">Customers ({customers.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search orders..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status}>
                        {status === 'All' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Orders Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="text-muted-foreground">
                            {searchQuery || statusFilter !== 'All' 
                              ? 'No orders match your filters' 
                              : 'No orders found'
                            }
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map(order => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.customerName}</div>
                              <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(order.orderDate)}</TableCell>
                          <TableCell>
                            <OrderStatusBadge status={order.status} />
                          </TableCell>
                          <TableCell>{order.items}</TableCell>
                          <TableCell className="font-medium">${order.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'processing')}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Mark Processing
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'shipped')}>
                                  <Truck className="h-4 w-4 mr-2" />
                                  Mark Shipped
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'delivered')}>
                                  Mark Delivered
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Load More Button */}
              {hasNextPage && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="customers" className="space-y-4">
              {/* Customer Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search customers..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Customer Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-md">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Customers</p>
                        <p className="text-xl font-bold">{customers.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-md">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Active This Month</p>
                        <p className="text-xl font-bold">{customers.filter(c => c.status === 'active').length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-md">
                        <Mail className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Orders</p>
                        <p className="text-xl font-bold">
                          {(customers.reduce((sum, c) => sum + c.orders, 0) / customers.length).toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Customers Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Last Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="text-muted-foreground">
                            {searchQuery ? 'No customers match your search' : 'No customers found'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCustomers.map(customer => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-muted-foreground">{customer.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{customer.orders}</TableCell>
                          <TableCell className="font-medium">${customer.totalSpent.toFixed(2)}</TableCell>
                          <TableCell>{formatDate(customer.lastOrder)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={customer.status === 'active' ? 'default' : 'secondary'}
                              className={customer.status === 'active' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                : ''
                              }
                            >
                              {customer.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}