'use client'

import { useState, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Search, 
  Loader2, 
  AlertCircle,
  Tag,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { useServiceCategories, useServiceCategoryOperations } from '@/hooks/useApi'
import type { ServiceCategoryDto, CreateServiceCategoryCommand, UpdateServiceCategoryCommand } from '@/lib/api/generated/model'
import { serviceCategoryFormSchema, type ServiceCategoryFormValues } from '@/lib/schemas'

export default function CategoriesPage() {
  const { data: categories, isLoading, error: fetchError } = useServiceCategories()
  const {
    createItem, isCreating,
    updateItem, isUpdating,
    deleteItem, isDeleting,
  } = useServiceCategoryOperations()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategoryDto | null>(null)

  const form = useForm<ServiceCategoryFormValues>({
    resolver: zodResolver(serviceCategoryFormSchema),
    defaultValues: { name: '', description: '', isActive: true }
  })

  const isSubmitting = isCreating || isUpdating

  const filteredCategories = useMemo(() => {
    let filtered = (categories ?? []).filter(cat => 
      cat.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    if (statusFilter === 'active') {
      filtered = filtered.filter(cat => cat.isActive)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(cat => !cat.isActive)
    }
    
    return filtered
  }, [categories, searchTerm, statusFilter])

  const activeCount = categories?.filter(c => c.isActive).length ?? 0
  const inactiveCount = categories?.filter(c => !c.isActive).length ?? 0

  const openDialog = (category?: ServiceCategoryDto) => {
    if (category) {
      setSelectedCategory(category)
      form.reset({ 
        name: category.name ?? '', 
        description: category.description ?? '', 
        isActive: category.isActive ?? true 
      })
    } else {
      setSelectedCategory(null)
      form.reset({ name: '', description: '', isActive: true })
    }
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (category: ServiceCategoryDto) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  const onSubmit = async (data: ServiceCategoryFormValues) => {
    const promise = selectedCategory
      ? (() => {
          if (typeof selectedCategory.id === 'undefined') throw new Error("Category ID is missing.")
          const payload: UpdateServiceCategoryCommand = { ...data, id: selectedCategory.id }
          return updateItem({ id: selectedCategory.id, data: payload })
        })()
      : (() => {
          const payload: CreateServiceCategoryCommand = data
          return createItem({ data: payload })
        })()

    toast.promise(promise, {
      loading: selectedCategory ? 'Updating category...' : 'Creating category...',
      success: () => {
        setIsDialogOpen(false)
        return `Category has been ${selectedCategory ? 'updated' : 'created'} successfully.`
      },
      error: (err) => (err as Error).message,
    })
  }

  const handleDelete = async () => {
    if (!selectedCategory || typeof selectedCategory.id === 'undefined') return
    toast.promise(deleteItem({ id: selectedCategory.id }), {
      loading: 'Deleting category...',
      success: `Category "${selectedCategory.name}" has been deleted.`,
      error: (err) => (err as Error).message,
    })
    setIsDeleteDialogOpen(false)
  }

  const handleToggleStatus = (category: ServiceCategoryDto) => {
    if (typeof category.id === 'undefined') return toast.error("Update failed: Category ID is missing.")
    
    const payload: UpdateServiceCategoryCommand = { 
      id: category.id,
      name: category.name, 
      description: category.description, 
      isActive: !category.isActive 
    }
    
    toast.promise(updateItem({ id: category.id, data: payload }), {
      loading: 'Updating status...',
      success: `Status changed to ${!category.isActive ? 'Active' : 'Inactive'}.`,
      error: (err) => (err as Error).message,
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Service Categories</h1>
          <p className="text-muted-foreground">Manage categories for your services</p>
        </div>
        <Button onClick={() => openDialog()} size="lg" className="gap-2">
          <Plus className="h-4 w-4" /> 
          Create Category
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{inactiveCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtered</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCategories.length}</div>
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
                  placeholder="Search categories..." 
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
                  All ({categories?.length ?? 0})
                </Button>
                <Button 
                  variant={statusFilter === 'active' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setStatusFilter('active')}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active ({activeCount})
                </Button>
                <Button 
                  variant={statusFilter === 'inactive' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setStatusFilter('inactive')}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Inactive ({inactiveCount})
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Categories List
          </CardTitle>
          <CardDescription>
            {filteredCategories.length} of {categories?.length ?? 0} categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Category Details</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length > 0 ? filteredCategories.map((category, index) => (
                <TableRow key={category.id} className={!category.isActive ? 'opacity-75' : ''}>
                  <TableCell className="font-medium text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Tag className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-base">{category.name}</h4>
                          {category.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <Badge variant={category.isActive ? 'default' : 'secondary'} className="w-fit">
                        {category.isActive ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Active</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                        )}
                      </Badge>
                      <Switch
                        checked={!!category.isActive}
                        onCheckedChange={() => handleToggleStatus(category)}
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
                        <DropdownMenuItem onClick={() => openDialog(category)}>
                          <Edit className="mr-2 h-4 w-4" /> 
                          Edit Category
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(category)} 
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
                      <Tag className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="text-lg font-medium">No categories found</p>
                        <p className="text-muted-foreground">
                          {searchTerm ? 'Try adjusting your search terms' : 'Create your first category to get started'}
                        </p>
                      </div>
                      {!searchTerm && (
                        <Button onClick={() => openDialog()}>
                          <Plus className="h-4 w-4 mr-2" /> Create First Category
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {selectedCategory ? 'Edit Category' : 'Create New Category'}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <div className="space-y-6 flex-1 overflow-hidden">
              <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
                <FormField 
                  control={form.control} 
                  name="name" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          disabled={isSubmitting} 
                          placeholder="Enter category name..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
                
                <FormField 
                  control={form.control} 
                  name="description" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={4}
                          disabled={isSubmitting} 
                          placeholder="Describe this category..."
                          className="resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
                
                <FormField 
                  control={form.control} 
                  name="isActive" 
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Active Category
                        </FormLabel>
                        <FormDescription>
                          Inactive categories will not be shown to customers
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
                  )} 
                />
              </div>
              
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
                  type="button" 
                  disabled={isSubmitting}
                  onClick={form.handleSubmit(onSubmit)}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedCategory ? 'Save Changes' : 'Create Category'}
                </Button>
              </DialogFooter>
            </div>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Category
            </AlertDialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete "<strong>{selectedCategory?.name}</strong>"? 
              This action cannot be undone and the category will be permanently removed.
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting} 
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}