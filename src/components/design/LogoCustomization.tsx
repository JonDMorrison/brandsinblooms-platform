"use client"

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Separator } from '@/src/components/ui/separator'
import { Upload, Wand2, Image as ImageIcon, Type, Trash2, Download } from 'lucide-react'
import { Alert, AlertDescription } from '@/src/components/ui/alert'

interface LogoCustomizationProps {
  logo: {
    url: string | null
    position: string
    size: string
  }
  onLogoChange: (logo: {
    url: string | null
    position: string
    size: string
  }) => void
}

const logoPositions = [
  { value: 'left', label: 'Left Aligned', description: 'Logo appears on the left side' },
  { value: 'center', label: 'Center Aligned', description: 'Logo appears in the center' },
  { value: 'right', label: 'Right Aligned', description: 'Logo appears on the right side' }
]

const logoSizes = [
  { value: 'small', label: 'Small', description: '120px width', pixels: '120px' },
  { value: 'medium', label: 'Medium', description: '160px width', pixels: '160px' },
  { value: 'large', label: 'Large', description: '200px width', pixels: '200px' },
  { value: 'extra-large', label: 'Extra Large', description: '240px width', pixels: '240px' }
]

const textLogoStyles = [
  {
    id: 'modern',
    name: 'Modern Sans',
    fontFamily: 'Inter',
    fontWeight: '700',
    letterSpacing: '-0.025em'
  },
  {
    id: 'classic',
    name: 'Classic Serif',
    fontFamily: 'Merriweather',
    fontWeight: '700',
    letterSpacing: 'normal'
  },
  {
    id: 'bold',
    name: 'Bold Impact',
    fontFamily: 'Montserrat',
    fontWeight: '900',
    letterSpacing: '-0.05em'
  },
  {
    id: 'elegant',
    name: 'Elegant Script',
    fontFamily: 'Playfair Display',
    fontWeight: '600',
    letterSpacing: 'normal'
  }
]

const logoTemplates = [
  {
    id: 'geometric',
    name: 'Geometric',
    description: 'Clean geometric shapes',
    color: '#8B5CF6'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and clean design',
    color: '#06B6D4'
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary styling',
    color: '#F59E0B'
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Artistic and unique',
    color: '#EF4444'
  }
]

export default function LogoCustomization({ logo, onLogoChange }: LogoCustomizationProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [textLogo, setTextLogo] = useState({ text: 'Your Brand', style: 'modern' })
  const [activeTab, setActiveTab] = useState('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogoChange = (updates: Partial<typeof logo>) => {
    onLogoChange({
      ...logo,
      ...updates
    })
  }

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 100)

    try {
      // Create object URL for preview (in real app, upload to server)
      const objectUrl = URL.createObjectURL(file)
      
      setTimeout(() => {
        setUploadProgress(100)
        handleLogoChange({ url: objectUrl })
        setIsUploading(false)
        clearInterval(interval)
      }, 1500)
    } catch (error) {
      console.error('Upload failed:', error)
      setIsUploading(false)
      clearInterval(interval)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const generateAILogo = (template: typeof logoTemplates[0]) => {
    // Mock AI logo generation - create a simple SVG logo
    const svg = `data:image/svg+xml,${encodeURIComponent(`
      <svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="80" fill="${template.color}" rx="8"/>
        <text x="100" y="45" text-anchor="middle" fill="white" font-family="Inter" font-size="18" font-weight="bold">
          ${textLogo.text}
        </text>
      </svg>
    `)}`
    
    handleLogoChange({ url: svg })
  }

  const generateTextLogo = () => {
    const selectedStyle = textLogoStyles.find(style => style.id === textLogo.style) || textLogoStyles[0]
    
    const svg = `data:image/svg+xml,${encodeURIComponent(`
      <svg width="300" height="100" xmlns="http://www.w3.org/2000/svg">
        <text x="150" y="55" text-anchor="middle" fill="#1F2937" 
              font-family="${selectedStyle.fontFamily}" 
              font-size="24" 
              font-weight="${selectedStyle.fontWeight}"
              letter-spacing="${selectedStyle.letterSpacing}">
          ${textLogo.text}
        </text>
      </svg>
    `)}`
    
    handleLogoChange({ url: svg })
  }

  const removeLogo = () => {
    handleLogoChange({ url: null })
  }

  return (
    <div className="space-y-6">
      {/* Current Logo Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Current Logo
          </CardTitle>
          <CardDescription>
            Your active logo and positioning settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Logo Preview */}
            <div className="border rounded-lg p-8 bg-gray-50">
              <div className={`flex ${logo.position === 'center' ? 'justify-center' : logo.position === 'right' ? 'justify-end' : 'justify-start'}`}>
                {logo.url ? (
                  <div className={`relative ${
                    logo.size === 'small' ? 'w-24 h-12' : 
                    logo.size === 'medium' ? 'w-32 h-16' : 
                    logo.size === 'large' ? 'w-40 h-20' : 'w-48 h-24'
                  }`}>
                    <Image 
                      src={logo.url} 
                      alt="Logo" 
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-32 h-16 border-2 border-dashed border-gray-300 rounded-lg">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Logo Info */}
            {logo.url && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Position: <strong>{logo.position}</strong></span>
                  <span>Size: <strong>{logo.size}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={removeLogo}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Logo
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Text Logo
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            AI Generator
          </TabsTrigger>
        </TabsList>

        {/* Upload Logo Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Your Logo</CardTitle>
              <CardDescription>
                Upload your existing logo file (PNG, JPG, SVG recommended)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {isUploading ? (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 text-primary mx-auto animate-pulse" />
                      <p className="text-sm font-medium">Uploading... {uploadProgress}%</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                      <p className="text-sm font-medium">Drag & drop your logo here</p>
                      <p className="text-xs text-gray-500">or click to browse files</p>
                      <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2"
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Upload Guidelines */}
                <Alert>
                  <AlertDescription>
                    <strong>Logo Guidelines:</strong> For best results, upload a high-resolution logo (at least 300x300px) 
                    with a transparent background (PNG format recommended).
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Text Logo Tab */}
        <TabsContent value="text" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Text Logo</CardTitle>
              <CardDescription>
                Design a text-based logo using your brand name
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Text Input */}
              <div className="space-y-2">
                <Label>Brand Name</Label>
                <Input
                  value={textLogo.text}
                  onChange={(e) => setTextLogo({ ...textLogo, text: e.target.value })}
                  placeholder="Enter your brand name"
                  className="text-lg"
                />
              </div>

              {/* Style Selection */}
              <div className="space-y-3">
                <Label>Text Style</Label>
                <RadioGroup 
                  value={textLogo.style} 
                  onValueChange={(value) => setTextLogo({ ...textLogo, style: value })}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {textLogoStyles.map((style) => (
                      <div key={style.id} className="flex items-center space-x-3">
                        <RadioGroupItem value={style.id} id={style.id} />
                        <Label htmlFor={style.id} className="flex-1 cursor-pointer">
                          <div className="p-3 border rounded-lg">
                            <div 
                              className="text-lg font-bold mb-1"
                              style={{
                                fontFamily: style.fontFamily,
                                fontWeight: style.fontWeight,
                                letterSpacing: style.letterSpacing
                              }}
                            >
                              {textLogo.text}
                            </div>
                            <div className="text-sm text-gray-600">{style.name}</div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={generateTextLogo}
                className="w-full"
                disabled={!textLogo.text.trim()}
              >
                <Type className="h-4 w-4 mr-2" />
                Generate Text Logo
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Generator Tab */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-600" />
                AI Logo Generator
              </CardTitle>
              <CardDescription>
                Let AI create a unique logo for your brand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Brand Name Input */}
              <div className="space-y-2">
                <Label>Brand Name</Label>
                <Input
                  value={textLogo.text}
                  onChange={(e) => setTextLogo({ ...textLogo, text: e.target.value })}
                  placeholder="Enter your brand name"
                />
              </div>

              {/* Logo Templates */}
              <div className="space-y-3">
                <Label>Choose a Style</Label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {logoTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2"
                      onClick={() => generateAILogo(template)}
                      disabled={!textLogo.text.trim()}
                    >
                      <div 
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: template.color }}
                      />
                      <div className="text-center">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-gray-600">{template.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Advanced AI Options */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-purple-600" />
                  <Label>Advanced Options</Label>
                  <Badge variant="secondary" className="text-xs">Beta</Badge>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                        <SelectItem value="food">Food & Beverage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Brand Personality</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select personality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                        <SelectItem value="elegant">Elegant</SelectItem>
                        <SelectItem value="playful">Playful</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Logo Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Logo Settings</CardTitle>
          <CardDescription>
            Configure how your logo appears on your website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Position Setting */}
          <div className="space-y-3">
            <Label>Logo Position</Label>
            <RadioGroup 
              value={logo.position} 
              onValueChange={(value) => handleLogoChange({ position: value })}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {logoPositions.map((position) => (
                  <div key={position.value} className="flex items-center space-x-3">
                    <RadioGroupItem value={position.value} id={position.value} />
                    <Label htmlFor={position.value} className="flex-1 cursor-pointer">
                      <div>
                        <div className="font-medium">{position.label}</div>
                        <div className="text-sm text-gray-600">{position.description}</div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Size Setting */}
          <div className="space-y-3">
            <Label>Logo Size</Label>
            <RadioGroup 
              value={logo.size} 
              onValueChange={(value) => handleLogoChange({ size: value })}
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {logoSizes.map((size) => (
                  <div key={size.value} className="flex items-center space-x-3">
                    <RadioGroupItem value={size.value} id={size.value} />
                    <Label htmlFor={size.value} className="flex-1 cursor-pointer">
                      <div>
                        <div className="font-medium">{size.label}</div>
                        <div className="text-sm text-gray-600">{size.description}</div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}