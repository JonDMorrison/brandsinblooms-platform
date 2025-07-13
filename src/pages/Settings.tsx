import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  User, 
  Globe, 
  Bell, 
  Palette, 
  Shield, 
  CreditCard,
  Camera,
  Save,
  Eye,
  EyeOff
} from "lucide-react";

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Personal Profile State
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "Sarah",
    lastName: "Johnson",
    email: user?.email || "",
    phone: "+1 (555) 123-4567",
    bio: "Passionate about sustainable living and natural products. Running Bloom & Grow since 2021."
  });

  // Site Configuration State
  const [siteConfig, setSiteConfig] = useState({
    siteName: "Bloom & Grow",
    siteDescription: "Your one-stop shop for organic gardening supplies and sustainable living products.",
    contactEmail: "support@bloomandgrow.com",
    contactPhone: "+1 (555) 234-5678",
    address: "123 Garden Lane, Green Valley, CA 90210",
    timezone: "America/Los_Angeles",
    currency: "USD"
  });

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    productAlerts: true,
    marketingEmails: false,
    weeklyReports: true,
    inventoryAlerts: true,
    customerMessages: true
  });

  // Account Security State
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSavePersonalInfo = () => {
    toast({
      title: "Profile Updated",
      description: "Your personal information has been saved successfully.",
    });
  };

  const handleSaveSiteConfig = () => {
    toast({
      title: "Site Settings Updated",
      description: "Your site configuration has been saved successfully.",
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Preferences Updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const handlePasswordChange = () => {
    toast({
      title: "Password Updated",
      description: "Your password has been changed successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account, site configuration, and preferences.
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-fit">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="site" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Site
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
          </TabsList>

          {/* Personal Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and profile information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="text-lg">
                      {personalInfo.firstName[0]}{personalInfo.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Change Photo
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Personal Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={personalInfo.firstName}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={personalInfo.lastName}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={personalInfo.phone}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself and your business..."
                    value={personalInfo.bio}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                  />
                </div>

                <Button onClick={handleSavePersonalInfo} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Site Configuration Tab */}
          <TabsContent value="site" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Site Configuration
                </CardTitle>
                <CardDescription>
                  Manage your website settings and business information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={siteConfig.siteName}
                      onChange={(e) => setSiteConfig(prev => ({ ...prev, siteName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={siteConfig.contactEmail}
                      onChange={(e) => setSiteConfig(prev => ({ ...prev, contactEmail: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    placeholder="Describe your business and what you offer..."
                    value={siteConfig.siteDescription}
                    onChange={(e) => setSiteConfig(prev => ({ ...prev, siteDescription: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      value={siteConfig.contactPhone}
                      onChange={(e) => setSiteConfig(prev => ({ ...prev, contactPhone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={siteConfig.timezone}
                      onValueChange={(value) => setSiteConfig(prev => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Your business address..."
                    value={siteConfig.address}
                    onChange={(e) => setSiteConfig(prev => ({ ...prev, address: e.target.value }))}
                    rows={2}
                  />
                </div>

                <Button onClick={handleSaveSiteConfig} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Configuration
                </Button>
              </CardContent>
            </Card>

            {/* Domain Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Domain Settings</CardTitle>
                <CardDescription>
                  Manage your custom domain and SSL settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">bloomandgrow.brandsinfbloom.com</p>
                    <p className="text-sm text-muted-foreground">Your current domain</p>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <Button variant="outline">
                  Add Custom Domain
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose what notifications you'd like to receive.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { key: 'orderUpdates', label: 'Order Updates', description: 'Get notified when orders are placed or updated' },
                  { key: 'productAlerts', label: 'Product Alerts', description: 'Notifications about product inventory and performance' },
                  { key: 'marketingEmails', label: 'Marketing Emails', description: 'Tips, trends, and promotional content' },
                  { key: 'weeklyReports', label: 'Weekly Reports', description: 'Summary of your site performance and sales' },
                  { key: 'inventoryAlerts', label: 'Inventory Alerts', description: 'Low stock and out-of-stock notifications' },
                  { key: 'customerMessages', label: 'Customer Messages', description: 'New contact form submissions and inquiries' }
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between space-x-4">
                    <div className="flex-1">
                      <Label htmlFor={key} className="text-base font-medium">
                        {label}
                      </Label>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    <Switch
                      id={key}
                      checked={notifications[key as keyof typeof notifications]}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, [key]: checked }))
                      }
                    />
                  </div>
                ))}

                <Button onClick={handleSaveNotifications} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Password & Security
                </CardTitle>
                <CardDescription>
                  Update your password and security settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Enter your current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter your new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your new password"
                    />
                  </div>
                </div>

                <Button onClick={handlePasswordChange} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Update Password
                </Button>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Authenticator App</p>
                    <p className="text-sm text-muted-foreground">
                      Use an authenticator app to generate codes
                    </p>
                  </div>
                  <Button variant="outline">
                    Enable 2FA
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing & Subscription
                </CardTitle>
                <CardDescription>
                  Manage your subscription and billing information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Plan */}
                <div className="border rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Professional Plan</h3>
                      <p className="text-muted-foreground">Perfect for growing businesses</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">$29</p>
                      <p className="text-sm text-muted-foreground">/month</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Current Plan</Badge>
                    <Badge variant="outline">Renews Jan 15, 2025</Badge>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Payment Method</h3>
                  <div className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">VISA</span>
                      </div>
                      <div>
                        <p className="font-medium">•••• •••• •••• 4242</p>
                        <p className="text-sm text-muted-foreground">Expires 12/2027</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Update
                    </Button>
                  </div>
                </div>

                {/* Billing History */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Recent Invoices</h3>
                  <div className="space-y-2">
                    {[
                      { date: "Dec 15, 2024", amount: "$29.00", status: "Paid" },
                      { date: "Nov 15, 2024", amount: "$29.00", status: "Paid" },
                      { date: "Oct 15, 2024", amount: "$29.00", status: "Paid" }
                    ].map((invoice, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b">
                        <div>
                          <p className="font-medium">{invoice.date}</p>
                          <p className="text-sm text-muted-foreground">Professional Plan</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{invoice.amount}</span>
                          <Badge variant="secondary">{invoice.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline">
                    Change Plan
                  </Button>
                  <Button variant="outline">
                    Download Invoices
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;