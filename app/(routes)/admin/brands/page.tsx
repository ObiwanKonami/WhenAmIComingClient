'use client'

import { useState, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Search, 
  Loader2, 
  AlertCircle,
  Building2,
  ExternalLink,
  Upload,
  LayoutGrid,
  List,
  Copy,
  CheckCircle2,
  Hash,
  Globe,
  Link,
} from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { useBrands, useBrandOperations, useUploadOperations } from '@/hooks/useApi'
import type { BrandDto, CreateBrandCommand, UpdateBrandCommand, PostApiUploadImageBody } from '@/lib/api/generated/model'
import { brandFormSchema, type BrandFormValues } from '@/lib/schemas'

// Business ID - Context'ten veya props'tan gelecek
const CURRENT_BUSINESS_ID = 1

export default function BrandsPage() {
  const { data: brands, isLoading, error: fetchError } = useBrands(CURRENT_BUSINESS_ID)
  const { 
    createItem, isCreating,
    updateItem, isUpdating,
    deleteItem, isDeleting 
  } = useBrandOperations(CURRENT_BUSINESS_ID)
  const { mutateAsync: uploadImage, isPending: isUploading } = useUploadOperations()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<BrandDto | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [copied, setCopied] = useState('')

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: { name: '', logoUrl: '', link: '', sortOrder: 0 }
  })
  
  const isSubmitting = isCreating || isUpdating
  const logoUrlFromForm = form.watch('logoUrl')

  const filteredBrands = useMemo(() => {
    return (brands ?? []).filter(brand => 
      brand.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }, [brands, searchTerm])

  const handleOpenDialog = (brand?: BrandDto) => {
    if (brand) {
      setSelectedBrand(brand)
      form.reset({
        name: brand.name ?? '',
        logoUrl: brand.logoUrl ?? '',
        link: brand.link ?? '',
        sortOrder: brand.sortOrder ?? 0,
      })
    } else {
      setSelectedBrand(null)
      const nextSortOrder = Math.max(...(brands?.map(b => b.sortOrder ?? 0) ?? [0])) + 1
      form.reset({ name: '', logoUrl: '', link: '', sortOrder: nextSortOrder })
    }
    setIsDialogOpen(true)
  }

  const handleOpenDeleteDialog = (brand: BrandDto) => {
    setSelectedBrand(brand)
    setIsDeleteDialogOpen(true)
  }
  
  const handleFileUpload = async (file: File) => {
    const payload: PostApiUploadImageBody = { file }
    
    toast.promise(uploadImage({ data: payload }), {
      loading: 'Uploading logo...',
      success: (data) => {
        form.setValue('logoUrl', (data as any)?.url || '', { shouldValidate: true })
        return 'Logo uploaded successfully!'
      },
      error: (err) => (err as Error).message,
    })
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await handleFileUpload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file)
    } else {
      toast.error('Please drop an image file')
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const onSubmit = async (data: BrandFormValues) => {
    const promise = selectedBrand
      ? (() => {
        if (typeof selectedBrand.id === 'undefined') throw new Error("Brand ID is missing.")
        const payload: UpdateBrandCommand = data
        return updateItem({ businessId: CURRENT_BUSINESS_ID, brandId: selectedBrand.id, data: payload })
      })()
      : (() => {
        const payload: CreateBrandCommand = data
        return createItem({ businessId: CURRENT_BUSINESS_ID, data: payload })
      })()

    toast.promise(promise, {
      loading: selectedBrand ? 'Updating brand...' : 'Creating brand...',
      success: () => { 
        setIsDialogOpen(false)
        return `Brand has been ${selectedBrand ? 'updated' : 'created'}.`
      },
      error: (err) => (err as Error).message,
    })
  }

  const handleDelete = async () => {
    if (!selectedBrand || typeof selectedBrand.id === 'undefined') return
    toast.promise(deleteItem({ businessId: CURRENT_BUSINESS_ID, brandId: selectedBrand.id }), {
      loading: 'Deleting brand...',
      success: () => { 
        setIsDeleteDialogOpen(false)
        return 'Brand has been deleted.' 
      },
      error: (err) => (err as Error).message,
    })
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      toast.success(`${type} copied to clipboard!`)
      setTimeout(() => setCopied(''), 2000)
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading brands...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground">Manage partner brands and showcase your collaborations</p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="lg" className="gap-2">
          <Plus className="h-4 w-4" /> 
          Add Brand
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Websites</CardTitle>
            <Globe className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {brands?.filter(b => b.link).length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtered Results</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredBrands.length}</div>
          </CardContent>
        </Card>
      </div>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{(fetchError as Error).message}</AlertDescription>
        </Alert>
      )}

      {/* Search and View Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search brands..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={viewMode === 'table' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {viewMode === 'table' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Brands List
            </CardTitle>
            <CardDescription>
              {filteredBrands.length} brands • Sorted by display order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead className="w-[100px]">Order</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrands.length > 0 ? filteredBrands.map(brand => (
                  <TableRow key={brand.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                          {brand.logoUrl ? (
                            <img 
                              src={brand.logoUrl} 
                              alt={brand.name ?? 'Brand Logo'} 
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.nextElementSibling!.classList.remove('hidden')
                              }}
                            />
                          ) : (
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          )}
                          <Building2 className="h-6 w-6 text-muted-foreground hidden" />
                        </div>
                        <div>
                          <div className="font-semibold">{brand.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Brand Partner
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {brand.link ? (
                        <div className="flex items-center gap-2">
                          <a 
                            href={brand.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                          >
                            <Globe className="h-3 w-3" />
                            Visit Website
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(brand.link!, 'Website URL')}
                            className="h-auto p-1"
                          >
                            {copied === 'Website URL' ? 
                              <CheckCircle2 className="h-3 w-3 text-green-600" /> : 
                              <Copy className="h-3 w-3" />
                            }
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No website</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        #{brand.sortOrder}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(brand)}>
                            <Edit className="mr-2 h-4 w-4" /> 
                            Edit Brand
                          </DropdownMenuItem>
                          {brand.link && (
                            <DropdownMenuItem onClick={() => copyToClipboard(brand.link!, 'Website URL')}>
                              <Copy className="mr-2 h-4 w-4" /> 
                              Copy URL
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleOpenDeleteDialog(brand)} 
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> 
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32">
                      <div className="text-center space-y-4">
                        <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
                        <div>
                          <p className="text-lg font-medium">No brands found</p>
                          <p className="text-muted-foreground">
                            {searchTerm ? 'Try adjusting your search terms' : 'Add your first brand partner to get started'}
                          </p>
                        </div>
                        {!searchTerm && (
                          <Button onClick={() => handleOpenDialog()}>
                            <Plus className="h-4 w-4 mr-2" /> Add First Brand
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBrands.map((brand) => (
            <Card key={brand.id} className="hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/20 group-hover:border-primary/50 transition-colors overflow-hidden bg-muted flex items-center justify-center">
                  {brand.logoUrl ? (
                    <img 
                      src={brand.logoUrl} 
                      alt={brand.name ?? 'Brand Logo'} 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling!.classList.remove('hidden')
                      }}
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  )}
                  <Building2 className="h-8 w-8 text-muted-foreground hidden" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{brand.name}</h3>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      <Hash className="h-3 w-3 mr-1" />
                      {brand.sortOrder}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {brand.link ? (
                  <div className="flex items-center justify-center">
                    <a 
                      href={brand.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm font-medium"
                    >
                      <Link className="h-4 w-4" />
                      Visit Website
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground text-sm">
                    No website available
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleOpenDialog(brand)}
                    className="flex-1 mr-2"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="px-3">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {brand.link && (
                        <DropdownMenuItem onClick={() => copyToClipboard(brand.link!, 'Website URL')}>
                          <Copy className="mr-2 h-4 w-4" /> 
                          Copy URL
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleOpenDeleteDialog(brand)} 
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> 
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredBrands.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No brands found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Try adjusting your search terms' : 'Add your first brand partner to showcase your collaborations'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" /> Add First Brand
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedBrand ? 'Edit Brand' : 'Add New Brand'}
            </DialogTitle>
            <DialogDescription>
              {selectedBrand ? 'Update brand information and logo' : 'Add a new brand partner with logo and details'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <div className="space-y-6 py-4">
              {/* Logo Upload Section */}
              <FormField control={form.control} name="logoUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Logo</FormLabel>
                  <div className="space-y-4">
                    {/* Logo Preview */}
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted flex items-center justify-center overflow-hidden">
                        {isUploading ? (
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        ) : logoUrlFromForm ? (
                          <img 
                            src={logoUrlFromForm} 
                            alt="Brand logo preview" 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-medium">Upload Logo</p>
                        <p className="text-xs text-muted-foreground">
                          SVG, PNG, JPG up to 10MB. Square images work best.
                        </p>
                      </div>
                    </div>
                    
                    {/* Upload Area */}
                    <div 
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        dragActive 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted-foreground/30 hover:border-muted-foreground/50'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          Drop your logo here, or 
                          <label className="text-primary hover:text-primary/80 cursor-pointer ml-1">
                            browse files
                            <FormControl>
                              <Input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleFileChange} 
                                disabled={isUploading}
                                className="hidden"
                              />
                            </FormControl>
                          </label>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supports: SVG, PNG, JPG, GIF
                        </p>
                      </div>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Brand Details */}
              <div className="grid grid-cols-1 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        disabled={isSubmitting}
                        placeholder="e.g., Apple, Google, Microsoft"
                      />
                    </FormControl>
                    <FormDescription>
                      The official name of the brand or company
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="link" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="https://example.com" 
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Link to the brand's official website
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="sortOrder" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={event => field.onChange(+event.target.value)} 
                        disabled={isSubmitting}
                        min="0"
                      />
                    </FormControl>
                    <FormDescription>
                      Lower numbers appear first in the list
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)} 
                disabled={isSubmitting || isUploading}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                disabled={isSubmitting || isUploading}
                onClick={form.handleSubmit(onSubmit)}
              >
                {(isSubmitting || isUploading) && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                {selectedBrand ? 'Save Changes' : 'Add Brand'}
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Brand
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "<strong>{selectedBrand?.name}</strong>"? 
              This action cannot be undone and will remove the brand from your partnerships list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting} 
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Brand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}