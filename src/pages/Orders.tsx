import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingCart,
  Search,
  MoreHorizontal,
  Eye,
  Package,
  Truck,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Users
} from 'lucide-react';

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock orders data
  const orders = [
    {
      id: '#1023',
      customer: 'Sarah Johnson',
      email: 'sarah@example.com',
      date: '2024-01-15',
      items: 3,
      total: 287.50,
      status: 'delivered',
      shipping: 'Express',
      products: ['Vintage Ceramic Vase', 'Luxury Throw Blanket', 'Modern Table Lamp'],
    },
    {
      id: '#1022',
      customer: 'Michael Chen',
      email: 'michael@example.com',
      date: '2024-01-14',
      items: 1,
      total: 129.99,
      status: 'shipped',
      shipping: 'Standard',
      products: ['Luxury Throw Blanket'],
    },
    {
      id: '#1021',
      customer: 'Emma Davis',
      email: 'emma@example.com',
      date: '2024-01-13',
      items: 2,
      total: 195.98,
      status: 'processing',
      shipping: 'Express',
      products: ['Minimalist Wall Art', 'Designer Cushion Set'],
    },
    {
      id: '#1020',
      customer: 'James Wilson',
      email: 'james@example.com',
      date: '2024-01-12',
      items: 1,
      total: 449.99,
      status: 'processing',
      shipping: 'Standard',
      products: ['Artisan Coffee Table'],
    },
    {
      id: '#1019',
      customer: 'Lisa Anderson',
      email: 'lisa@example.com',
      date: '2024-01-11',
      items: 4,
      total: 356.96,
      status: 'cancelled',
      shipping: 'Express',
      products: ['Vintage Ceramic Vase', 'Modern Table Lamp', 'Designer Cushion Set', 'Minimalist Wall Art'],
    },
    {
      id: '#1018',
      customer: 'David Brown',
      email: 'david@example.com',
      date: '2024-01-10',
      items: 2,
      total: 269.98,
      status: 'delivered',
      shipping: 'Standard',
      products: ['Modern Table Lamp', 'Designer Cushion Set'],
    },
  ];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="default" className="bg-success"><CheckCircle className="mr-1 h-3 w-3" />Delivered</Badge>;
      case 'shipped':
        return <Badge variant="default" className="bg-primary"><Truck className="mr-1 h-3 w-3" />Shipped</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-warning"><Clock className="mr-1 h-3 w-3" />Processing</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const orderStats = {
    total: orders.length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    processing: orders.filter(o => o.status === 'processing').length,
    revenue: orders.reduce((sum, order) => order.status !== 'cancelled' ? sum + order.total : sum, 0),
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">
            Track and manage your customer orders
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="gradient-card border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{orderStats.total}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="gradient-card border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold">{orderStats.delivered}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="gradient-card border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold">{orderStats.processing}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="gradient-card border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">${orderStats.revenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="gradient-card border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Manage and track all customer orders
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-accent/50">
                  <TableCell>
                    <div className="font-medium">{order.id}</div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customer}</p>
                      <p className="text-sm text-muted-foreground">{order.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{order.items} items</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">${order.total.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">{order.shipping}</div>
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Package className="mr-2 h-4 w-4" />
                          Update Status
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Truck className="mr-2 h-4 w-4" />
                          Track Shipment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Order Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="gradient-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Order Trends</span>
            </CardTitle>
            <CardDescription>
              Your order performance this month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Orders This Month</span>
                <span className="font-medium">23 orders</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-gradient-primary h-2 rounded-full w-3/4"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Average Order Value</span>
                <span className="font-medium">$156.32</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-gradient-secondary h-2 rounded-full w-2/3"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Customer Satisfaction</span>
                <span className="font-medium">96%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-success h-2 rounded-full w-[96%]"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Top Customers</span>
            </CardTitle>
            <CardDescription>
              Your most valuable customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {orders
              .filter(order => order.status !== 'cancelled')
              .slice(0, 4)
              .map((order, index) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {order.customer.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{order.customer}</p>
                      <p className="text-xs text-muted-foreground">{order.items} items</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">${order.total.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{order.date}</p>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Orders;