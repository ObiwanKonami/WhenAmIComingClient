'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Search, 
  Loader2, 
  AlertCircle, 
  ExternalLink,
  FileText,
  Globe,
  Eye,
  EyeOff,
  Calendar,
  Hash,
  BookOpen,
  Settings2,
  Copy,
  CheckCircle2,
  Filter,
  SortAsc,
  LayoutGrid,
  List
} from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { usePages, usePageOperations } from '@/hooks/useApi'
import type { PageDto, CreatePageCommand, UpdatePageCommand } from '@/lib/api/generated/model'
import { pageFormSchema, type PageFormValues } from '@/lib/schemas'

export default function PagesPage() {
  const { data: pages, isLoading, error: fetchError } = usePages()
  const {
    createItem, isCreating,
    updateItem, isUpdating,
    deleteItem, isDeleting,
  } = usePageOperations()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPage, setSelectedPage] = useState<PageDto | null>(null)
  const [activeTab, setActiveTab] = useState('content')
  const [copied, setCopied] = useState('')

  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: {
      title: '', slug: '', content: '', details: '',
      metaTitle: '', metaDescription: '', isPublished: true,
    }
  })
  
  const { watch, setValue, formState } = form
  const watchedTitle = watch('title')
  const isSubmitting = isCreating || isUpdating

  const filteredPages = useMemo(() => {
    let filtered = (pages ?? []).filter(page =>
      page.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    if (statusFilter === 'published') {
      filtered = filtered.filter(page => page.isPublished)
    } else if (statusFilter === 'draft') {
      filtered = filtered.filter(page => !page.isPublished)
    }
    
    return filtered
  }, [pages, searchTerm, statusFilter])

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim()

  useEffect(() => {
    if (formState.isSubmitting) return
    const currentSlug = form.getValues('slug')
    const slugFromTitle = generateSlug(watchedTitle)
    if (!currentSlug || generateSlug(form.getValues('title')) === currentSlug) {
      setValue('slug', slugFromTitle, { shouldValidate: true })
    }
  }, [watchedTitle, setValue, formState.isSubmitting, form])

  const handleOpenDialog = (page?: PageDto) => {
    if (page) {
      setSelectedPage(page)
      form.reset({
        title: page.title ?? '', 
        slug: page.slug ?? '', 
        content: page.content ?? '', 
        details: page.details ?? '',
        metaTitle: page.metaTitle ?? '', 
        metaDescription: page.metaDescription ?? '', 
        isPublished: !!page.isPublished,
      })
    } else {
      setSelectedPage(null)
      form.reset({
        title: '', slug: '', content: '', details: '',
        metaTitle: '', metaDescription: '', isPublished: true,
      })
    }
    setActiveTab('content')
    setIsDialogOpen(true)
  }

  const handleOpenDeleteDialog = (page: PageDto) => {
    setSelectedPage(page)
    setIsDeleteDialogOpen(true)
  }

  const onSubmit = async (data: PageFormValues) => {
    const promise = selectedPage
      ? (() => {
          if (typeof selectedPage.id === 'undefined') throw new Error("Page ID is missing.")
          const payload: UpdatePageCommand = data
          return updateItem({ pageId: selectedPage.id, data: payload })
        })()
      : (() => {
          const payload: CreatePageCommand = data
          return createItem({ data: payload })
        })()

    toast.promise(promise, {
      loading: selectedPage ? 'Updating page...' : 'Creating page...',
      success: () => {
        setIsDialogOpen(false)
        return `Page has been ${selectedPage ? 'updated' : 'created'} successfully.`
      },
      error: (err) => (err as Error).message,
    })
  }

  const handleDelete = async () => {
    if (!selectedPage || typeof selectedPage.id === 'undefined') return
    toast.promise(deleteItem({ pageId: selectedPage.id }), {
      loading: 'Deleting page...',
      success: () => {
        setIsDeleteDialogOpen(false)
        return 'Page has been deleted.'
      },
      error: (err) => (err as Error).message,
    })
  }

  const handleTogglePublished = (page: PageDto) => {
    if (typeof page.id === 'undefined') return toast.error("Update failed: Page ID is missing.")
    
    const payload: UpdatePageCommand = {
        title: page.title ?? '', 
        slug: page.slug ?? '', 
        content: page.content ?? '',
        details: page.details ?? '', 
        metaTitle: page.metaTitle ?? '',
        metaDescription: page.metaDescription ?? '',
        isPublished: !page.isPublished,
    }

    toast.promise(updateItem({ pageId: page.id, data: payload }), {
      loading: 'Updating status...',
      success: 'Publish status has been updated.',
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

  const publishedCount = pages?.filter(p => p.isPublished).length ?? 0
  const draftCount = pages?.filter(p => !p.isPublished).length ?? 0

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading pages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
          <p className="text-muted-foreground">Create and manage your website's static pages</p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="lg" className="gap-2">
          <Plus className="h-4 w-4" /> 
          Create Page
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pages?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Globe className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{publishedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Edit className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{draftCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtered</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPages.length}</div>
          </CardContent>
        </Card>
      </div>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{(fetchError as Error).message}</AlertDescription>
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
                  placeholder="Search pages..." 
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
                  All ({pages?.length ?? 0})
                </Button>
                <Button 
                  variant={statusFilter === 'published' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setStatusFilter('published')}
                >
                  <Globe className="h-3 w-3 mr-1" />
                  Published ({publishedCount})
                </Button>
                <Button 
                  variant={statusFilter === 'draft' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setStatusFilter('draft')}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Drafts ({draftCount})
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
              <FileText className="h-5 w-5" />
              Pages List
            </CardTitle>
            <CardDescription>
              {filteredPages.length} of {pages?.length ?? 0} pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page Details</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPages.length > 0 ? filteredPages.map((page) => (
                  <TableRow key={page.id} className={!page.isPublished ? 'opacity-75' : ''}>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold text-base">{page.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <a 
                                href={`/pages/${page.slug}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 font-mono"
                              >
                                /{page.slug} <ExternalLink className="h-3 w-3" />
                              </a>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(`/pages/${page.slug}`, 'URL')}
                                className="h-auto p-1"
                              >
                                {copied === 'URL' ? 
                                  <CheckCircle2 className="h-3 w-3 text-green-600" /> : 
                                  <Copy className="h-3 w-3" />
                                }
                              </Button>
                            </div>
                          </div>
                        </div>
                        {page.details && (
                          <p className="text-sm text-muted-foreground ml-11">{page.details}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <Badge variant={page.isPublished ? 'default' : 'secondary'} className="w-fit">
                          {page.isPublished ? (
                            <><Globe className="h-3 w-3 mr-1" /> Published</>
                          ) : (
                            <><Edit className="h-3 w-3 mr-1" /> Draft</>
                          )}
                        </Badge>
                        <Switch
                          checked={!!page.isPublished}
                          onCheckedChange={() => handleTogglePublished(page)}
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
                          <DropdownMenuItem onClick={() => handleOpenDialog(page)}>
                            <Edit className="mr-2 h-4 w-4" /> 
                            Edit Page
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => copyToClipboard(`/pages/${page.slug}`, 'Page URL')}
                          >
                            <Copy className="mr-2 h-4 w-4" /> 
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleOpenDeleteDialog(page)} 
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
                    <TableCell colSpan={3} className="h-32">
                      <div className="text-center space-y-4">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                        <div>
                          <p className="text-lg font-medium">No pages found</p>
                          <p className="text-muted-foreground">
                            {searchTerm ? 'Try adjusting your search terms' : 'Create your first page to get started'}
                          </p>
                        </div>
                        {!searchTerm && (
                          <Button onClick={() => handleOpenDialog()}>
                            <Plus className="h-4 w-4 mr-2" /> Create First Page
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
          {filteredPages.map((page) => (
            <Card key={page.id} className={`hover:shadow-lg transition-shadow ${!page.isPublished ? 'opacity-75' : ''}`}>
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-primary/10 w-fit">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={page.isPublished ? 'default' : 'secondary'}>
                      {page.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(page)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenDeleteDialog(page)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg leading-tight">{page.title}</h3>
                  {page.details && (
                    <p className="text-sm text-muted-foreground mt-1">{page.details}</p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="h-3 w-3 text-muted-foreground" />
                  <code className="text-muted-foreground font-mono">/{page.slug}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`/pages/${page.slug}`, page.slug || '')}
                    className="h-auto p-1"
                  >
                    {copied === page.slug ? 
                      <CheckCircle2 className="h-3 w-3 text-green-600" /> : 
                      <Copy className="h-3 w-3" />
                    }
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <Switch
                    checked={!!page.isPublished}
                    onCheckedChange={() => handleTogglePublished(page)}
                    disabled={isUpdating}
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(page)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/pages/${page.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredPages.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No pages found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Try adjusting your search terms' : 'Create your first page to get started'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" /> Create First Page
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedPage ? 'Edit Page' : 'Create New Page'}
            </DialogTitle>
            <DialogDescription>
              {selectedPage ? 'Update your page content and settings' : 'Create a new page for your website'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <div className="flex-1 overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="content" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Content
                  </TabsTrigger>
                  <TabsTrigger value="seo" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    SEO
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Settings
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto mt-4">
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <TabsContent value="content" className="space-y-6 mt-0">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Page Title</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isSubmitting} placeholder="About Us" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="slug" render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL Slug</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                                  /pages/
                                </span>
                                <Input {...field} disabled={isSubmitting} className="rounded-l-none" placeholder="about-us" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      
                      <FormField control={form.control} name="details" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short Description</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isSubmitting} placeholder="Brief description of this page" />
                          </FormControl>
                          <FormDescription>
                            A short description that appears in page listings
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )} />
                      
                      <FormField control={form.control} name="content" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Page Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              disabled={isSubmitting} 
                              rows={12} 
                              placeholder="Write your page content here..."
                              className="resize-none"
                            />
                          </FormControl>
                          <FormDescription>
                            Supports Markdown formatting for rich text content
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </TabsContent>

                    <TabsContent value="seo" className="space-y-6 mt-0">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">Search Engine Optimization</h3>
                          <p className="text-sm text-muted-foreground">
                            Optimize your page for search engines and social media sharing
                          </p>
                        </div>
                        
                        <FormField control={form.control} name="metaTitle" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meta Title</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isSubmitting} placeholder="About Us - Your Company" />
                            </FormControl>
                            <FormDescription>
                              The title that appears in search results (recommended: 50-60 characters)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                        
                        <FormField control={form.control} name="metaDescription" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meta Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                disabled={isSubmitting} 
                                rows={3}
                                placeholder="Learn about our company history, mission, and values..."
                              />
                            </FormControl>
                            <FormDescription>
                              The description that appears in search results (recommended: 150-160 characters)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-6 mt-0">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">Page Settings</h3>
                          <p className="text-sm text-muted-foreground">
                            Control page visibility and publication status
                          </p>
                        </div>
                        
                        <FormField control={form.control} name="isPublished" render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Publish Page
                              </FormLabel>
                              <FormDescription>
                                Make this page visible to the public on your website
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
                        
                        <div className="rounded-lg border p-4 space-y-3">
                          <h4 className="font-medium">Page Preview</h4>
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="text-muted-foreground">URL:</span>
                              <span className="ml-2 font-mono">/pages/{watch('slug') || 'page-url'}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Status:</span>
                              <Badge variant={watch('isPublished') ? 'default' : 'secondary'} className="ml-2">
                                {watch('isPublished') ? 'Published' : 'Draft'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </form>
                </div>
              </Tabs>
            </div>
            
            <Separator />
            <DialogFooter className="flex-shrink-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)} 
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                onClick={form.handleSubmit(onSubmit)}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedPage ? 'Save Changes' : 'Create Page'}
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
              Delete Page
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "<strong>{selectedPage?.title}</strong>"? 
              This action cannot be undone and the page will be permanently removed from your website.
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
              Delete Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}