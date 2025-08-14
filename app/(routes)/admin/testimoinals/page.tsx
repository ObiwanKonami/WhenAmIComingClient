'use client'

import { useState, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  MessageSquareQuote,
  User,
  Eye,
  EyeOff,
  Star,
  Upload,
  LayoutGrid,
  List,
  Copy,
  CheckCircle2,
  Quote
} from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { useTestimonials, useTestimonialOperations, useUploadOperations } from '@/hooks/useApi'
import type { TestimonialDto, CreateTestimonialCommand, UpdateTestimonialCommand, PostApiUploadImageBody } from '@/lib/api/generated/model'
import { testimonialFormSchema, type TestimonialFormValues } from '@/lib/schemas'

export default function TestimonialsPage() {
  const { data: testimonials, isLoading, error: fetchError } = useTestimonials()
  
  const { 
    createItem: createTestimonial, isCreating, 
    updateItem: updateTestimonial, isUpdating, 
    deleteItem: deleteTestimonial, isDeleting 
  } = useTestimonialOperations()
  const { mutateAsync: uploadImage, isPending: isUploading } = useUploadOperations()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTestimonial, setSelectedTestimonial] = useState<TestimonialDto | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [copied, setCopied] = useState('')

  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialFormSchema),
    defaultValues: { name: '', designation: '', feedback: '', imageUrl: '', isVisible: true }
  })
  
  const isSubmitting = isCreating || isUpdating
  const imageUrlFromForm = form.watch('imageUrl')

  const filteredTestimonials = useMemo(() => {
    let filtered = (testimonials ?? []).filter((t: TestimonialDto) => 
      t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.feedback?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    if (statusFilter === 'visible') {
      filtered = filtered.filter(t => t.isVisible)
    } else if (statusFilter === 'hidden') {
      filtered = filtered.filter(t => !t.isVisible)
    }
    
    return filtered
  }, [testimonials, searchTerm, statusFilter])

  const visibleCount = testimonials?.filter(t => t.isVisible).length ?? 0
  const hiddenCount = testimonials?.filter(t => !t.isVisible).length ?? 0

  const handleOpenDialog = (testimonial?: TestimonialDto) => {
    if (testimonial) {
      setSelectedTestimonial(testimonial)
      form.reset({ 
        name: testimonial.name ?? '', 
        designation: testimonial.designation ?? '', 
        feedback: testimonial.feedback ?? '', 
        imageUrl: testimonial.imageUrl ?? '', 
        isVisible: testimonial.isVisible ?? true
      })
    } else {
      setSelectedTestimonial(null)
      form.reset({ name: '', designation: '', feedback: '', imageUrl: '', isVisible: true })
    }
    setIsDialogOpen(true)
  }
  
  const handleOpenDeleteDialog = (testimonial: TestimonialDto) => {
    setSelectedTestimonial(testimonial)
    setIsDeleteDialogOpen(true)
  }

  const handleFileUpload = async (file: File) => {
    const payload: PostApiUploadImageBody = { file }
    
    toast.promise(uploadImage({ data: payload }), {
      loading: 'Uploading image...',
      success: (data) => {
        form.setValue('imageUrl', (data as any)?.url || '', { shouldValidate: true })
        return 'Image uploaded successfully!'
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

  const onSubmit = async (data: TestimonialFormValues) => {
    const promise = selectedTestimonial
      ? (() => {
          if (typeof selectedTestimonial.id === 'undefined') throw new Error("Testimonial ID is missing.")
          const payload: UpdateTestimonialCommand = data
          return updateTestimonial({ testimonialId: selectedTestimonial.id, data: payload })
        })()
      : (() => {
          const payload: CreateTestimonialCommand = data
          return createTestimonial({ data: payload })
        })()

    toast.promise(promise, {
      loading: selectedTestimonial ? 'Updating testimonial...' : 'Creating testimonial...',
      success: () => {
        setIsDialogOpen(false)
        return `Testimonial has been ${selectedTestimonial ? 'updated' : 'created'}.`
      },
      error: (err) => (err as Error).message,
    })
  }

  const handleDelete = async () => {
    if (!selectedTestimonial || typeof selectedTestimonial.id === 'undefined') return
    toast.promise(deleteTestimonial({ testimonialId: selectedTestimonial.id }), {
      loading: 'Deleting testimonial...',
      success: () => {
        setIsDeleteDialogOpen(false)
        return 'Testimonial has been deleted.'
      },
      error: (err) => (err as Error).message,
    })
  }

  const handleToggleVisibility = (testimonial: TestimonialDto) => {
    if (typeof testimonial.id === 'undefined') return toast.error("Update failed: Testimonial ID is missing.")
    
    const payload: UpdateTestimonialCommand = {
        name: testimonial.name,
        designation: testimonial.designation,
        feedback: testimonial.feedback,
        imageUrl: testimonial.imageUrl,
        isVisible: !testimonial.isVisible,
    }

    toast.promise(updateTestimonial({ testimonialId: testimonial.id, data: payload }), {
      loading: 'Updating status...',
      success: 'Visibility has been updated.',
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

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'UN'
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading testimonials...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Testimonials</h1>
          <p className="text-muted-foreground">Showcase customer feedback and build trust with social proof</p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="lg" className="gap-2">
          <Plus className="h-4 w-4" /> 
          Add Testimonial
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquareQuote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testimonials?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visible</CardTitle>
            <Eye className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{visibleCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hidden</CardTitle>
            <EyeOff className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{hiddenCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtered</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTestimonials.length}</div>
          </CardContent>
        </Card>
      </div>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{fetchError.message}</AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search testimonials..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={statusFilter === 'all' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  All ({testimonials?.length ?? 0})
                </Button>
                <Button 
                  variant={statusFilter === 'visible' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setStatusFilter('visible')}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Visible ({visibleCount})
                </Button>
                <Button 
                  variant={statusFilter === 'hidden' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setStatusFilter('hidden')}
                >
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hidden ({hiddenCount})
                </Button>
              </div>
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
              <MessageSquareQuote className="h-5 w-5" />
              Customer Reviews
            </CardTitle>
            <CardDescription>
              {filteredTestimonials.length} testimonials • Manage customer feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Customer</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTestimonials.length > 0 ? filteredTestimonials.map((testimonial: any) => (
                  <TableRow key={testimonial.id} className={!testimonial.isVisible ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={testimonial.imageUrl} alt={testimonial.name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getInitials(testimonial.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{testimonial.name}</div>
                          <div className="text-sm text-muted-foreground">{testimonial.designation}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-lg">
                        <p className="text-sm line-clamp-2">{testimonial.feedback}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <Badge variant={testimonial.isVisible ? 'default' : 'secondary'}>
                          {testimonial.isVisible ? (
                            <><Eye className="h-3 w-3 mr-1" /> Visible</>
                          ) : (
                            <><EyeOff className="h-3 w-3 mr-1" /> Hidden</>
                          )}
                        </Badge>
                        <Switch
                          checked={testimonial.isVisible}
                          onCheckedChange={() => handleToggleVisibility(testimonial)}
                          disabled={isUpdating}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(testimonial)}>
                            <Edit className="mr-2 h-4 w-4" /> 
                            Edit Review
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => copyToClipboard(testimonial.feedback, 'Feedback')}
                          >
                            <Copy className="mr-2 h-4 w-4" /> 
                            Copy Feedback
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleOpenDeleteDialog(testimonial)} 
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
                        <MessageSquareQuote className="h-12 w-12 text-muted-foreground mx-auto" />
                        <div>
                          <p className="text-lg font-medium">No testimonials found</p>
                          <p className="text-muted-foreground">
                            {searchTerm ? 'Try adjusting your search terms' : 'Add your first customer testimonial to build trust'}
                          </p>
                        </div>
                        {!searchTerm && (
                          <Button onClick={() => handleOpenDialog()}>
                            <Plus className="h-4 w-4 mr-2" /> Add First Testimonial
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTestimonials.map((testimonial: any) => (
            <Card key={testimonial.id} className={`hover:shadow-lg transition-all duration-300 ${!testimonial.isVisible ? 'opacity-75' : ''}`}>
              <CardContent className="p-6 space-y-4">
                {/* Quote Icon & Status */}
                <div className="flex items-start justify-between">
                  <Quote className="h-8 w-8 text-primary/20" />
                  <div className="flex items-center gap-2">
                    <Badge variant={testimonial.isVisible ? 'default' : 'secondary'}>
                      {testimonial.isVisible ? 'Visible' : 'Hidden'}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(testimonial)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyToClipboard(testimonial.feedback, testimonial.name)}>
                          <Copy className="mr-2 h-4 w-4" /> Copy Feedback
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleOpenDeleteDialog(testimonial)} 
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Feedback */}
                <blockquote className="text-sm leading-relaxed">
                  "{testimonial.feedback}"
                </blockquote>

                {/* Customer Info */}
                <div className="flex items-center gap-3 pt-2 border-t">
                  <Avatar>
                    <AvatarImage src={testimonial.imageUrl} alt={testimonial.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(testimonial.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.designation}</p>
                  </div>
                  <Switch
                    checked={testimonial.isVisible}
                    onCheckedChange={() => handleToggleVisibility(testimonial)}
                    disabled={isUpdating}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredTestimonials.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="text-center py-12">
                <MessageSquareQuote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No testimonials found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Try adjusting your search terms' : 'Start building trust with customer testimonials'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" /> Add First Testimonial
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareQuote className="h-5 w-5" />
              {selectedTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
            </DialogTitle>
            <DialogDescription>
              {selectedTestimonial ? 
                'Update customer feedback and details' : 
                'Capture and showcase customer feedback to build trust'
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <div className="space-y-6 py-4 flex-1 overflow-y-auto">
              {/* Image Upload Section */}
              <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Photo</FormLabel>
                  <div className="space-y-4">
                    {/* Photo Preview */}
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground/30 overflow-hidden bg-muted flex items-center justify-center">
                        {isUploading ? (
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        ) : imageUrlFromForm ? (
                          <img 
                            src={imageUrlFromForm} 
                            alt="Customer photo" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-medium">Upload Photo</p>
                        <p className="text-xs text-muted-foreground">
                          Professional headshots work best. Square images recommended.
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
                          Drop photo here, or 
                          <label className="text-primary hover:text-primary/80 cursor-pointer ml-1">
                            browse files
                            <FormControl>
                              <Input 
                                type="file" 
                                accept="image/png, image/jpeg" 
                                onChange={handleFileChange} 
                                disabled={isUploading}
                                className="hidden"
                              />
                            </FormControl>
                          </label>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG or JPEG up to 10MB
                        </p>
                      </div>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Customer Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        disabled={isSubmitting}
                        placeholder="John Smith"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="designation" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title & Company</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        disabled={isSubmitting}
                        placeholder="CEO, Acme Corp"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              
              <FormField control={form.control} name="feedback" render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Feedback</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      rows={5} 
                      disabled={isSubmitting}
                      placeholder="This product has completely transformed how we work..."
                      className="resize-none"
                    />
                  </FormControl>
                  <FormDescription>
                    Write the customer's testimonial in their own words. Keep it authentic and specific.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="isVisible" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Show on Website
                    </FormLabel>
                    <FormDescription>
                      Display this testimonial publicly on your website
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch 
                      checked={field.value} 
                      onCheckedChange={field.onChange} 
                      disabled={isSubmitting} 
                    />
                  </FormControl>
                </FormItem>
              )} />
            </div>
            
            <DialogFooter className="flex-shrink-0">
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
                {selectedTestimonial ? 'Save Changes' : 'Add Testimonial'}
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
              Delete Testimonial
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the testimonial from "<strong>{selectedTestimonial?.name}</strong>"? 
              This action cannot be undone and will remove this customer feedback permanently.
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
              Delete Testimonial
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}