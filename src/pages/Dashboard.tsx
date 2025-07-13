import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  FileText,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Plus,
  Sparkles,
  Edit,
  Eye
} from 'lucide-react';

const Dashboard = () => {
  // Mock data for the dashboard
  const stats = [
    {
      title: 'Total Pages',
      value: '12',
      description: '+2 from last month',
      icon: FileText,
      trend: 'up',
    },
    {
      title: 'Products Listed',
      value: '47',
      description: '+7 from last month',
      icon: Package,
      trend: 'up',
    },
    {
      title: 'Orders This Month',
      value: '23',
      description: '+12% from last month',
      icon: ShoppingCart,
      trend: 'up',
    },
    {
      title: 'Site Views',
      value: '1,247',
      description: '+18% from last month',
      icon: Eye,
      trend: 'up',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'order',
      title: 'New order received',
      description: 'Order #1023 - $87.50',
      timestamp: '2 hours ago',
      status: 'success',
    },
    {
      id: 2,
      type: 'content',
      title: 'Blog post published',
      description: 'How to Style Your Home for Spring',
      timestamp: '5 hours ago',
      status: 'info',
    },
    {
      id: 3,
      type: 'product',
      title: 'Product added',
      description: 'Vintage Ceramic Vase',
      timestamp: '1 day ago',
      status: 'success',
    },
  ];

  const quickActions = [
    {
      title: 'Create New Page',
      description: 'Add a new page to your site',
      icon: FileText,
      href: '/dashboard/content/new',
      variant: 'gradient' as const,
    },
    {
      title: 'Add Products',
      description: 'Browse and add products from catalogue',
      icon: Package,
      href: '/dashboard/products',
      variant: 'default' as const,
    },
    {
      title: 'AI Content Generator',
      description: 'Generate content with AI assistance',
      icon: Sparkles,
      href: '/dashboard/ai-tools',
      variant: 'accent' as const,
    },
  ];

  return (
    <div className="space-y-8 fade-in">

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={stat.title} className="interactive gradient-card border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <TrendingUp className="h-3 w-3 mr-1 text-success" />
                {stat.description}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Card key={action.title} className="interactive hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-primary rounded-lg">
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant={action.variant} className="w-full" asChild>
                  <Link to={action.href}>
                    Get Started
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="gradient-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>
              Your latest site activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg bg-background/50">
                <div className="flex-1">
                  <p className="font-medium text-sm">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                </div>
                <Badge variant={activity.status === 'success' ? 'default' : 'secondary'}>
                  {activity.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Site Performance</span>
            </CardTitle>
            <CardDescription>
              Overview of your site metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Page Views</span>
                <span className="font-medium">1,247</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-gradient-primary h-2 rounded-full w-3/4"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Conversion Rate</span>
                <span className="font-medium">3.2%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-gradient-secondary h-2 rounded-full w-1/3"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Bounce Rate</span>
                <span className="font-medium">42%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-warning h-2 rounded-full w-2/5"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;