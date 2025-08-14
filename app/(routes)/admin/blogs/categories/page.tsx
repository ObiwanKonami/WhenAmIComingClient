// app/admin/blog/categories/page.tsx - EKSİKSİZ NİHAİ SÜRÜM
'use client'

import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Plus, MoreHorizontal, Edit, Trash2, Search, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { useBlogCategories, useBlogCategoryOperations } from '@/hooks/useApi';
import type { BlogCategoryDto, CreateBlogCategoryCommand, UpdateBlogCategoryCommand } from '@/lib/api/generated/model';
import { blogCategoryFormSchema, type BlogCategoryFormValues } from '@/lib/schemas';

export default function BlogCategoriesPage() {
  const { data: categories, isLoading, error: fetchError } = useBlogCategories();
  const { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting } = useBlogCategoryOperations();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BlogCategoryDto | null>(null);

  const form = useForm<BlogCategoryFormValues>({
    resolver: zodResolver(blogCategoryFormSchema),
    defaultValues: { name: '', slug: '', isActive: true },
  });

  const isSubmitting = isCreating || isUpdating;

  const filteredCategories = useMemo(() => {
    return (categories ?? []).filter(cat => cat.name?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [categories, searchTerm]);

  const handleOpenDialog = (category?: BlogCategoryDto) => {
    if (category) {
      setSelectedCategory(category);
      form.reset({
        name: category.name ?? '',
        slug: category.slug ?? '',
        isActive: category.isActive ?? true,
      });
    } else {
      setSelectedCategory(null);
      form.reset({ name: '', slug: '', isActive: true });
    }
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (category: BlogCategoryDto) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (data: BlogCategoryFormValues) => {
    const promise = selectedCategory
      ? (() => {
        if (!selectedCategory?.id) throw new Error("Category ID is missing.");
        
        // DÜZELTME 1: `payload`'dan `categoryId` alanını çıkarıyoruz.
        // `UpdateBlogCategoryCommand` sadece `name`, `slug`, `isActive` bekler.
        const payload: UpdateBlogCategoryCommand = {
            name: data.name,
            slug: data.slug,
            isActive: data.isActive
        };
        return updateItem({ categoryId: selectedCategory.id, data: payload });
      })()
      : (() => {
        const payload: CreateBlogCategoryCommand = data;
        return createItem({ data: payload });
      })();
    
    toast.promise(promise, {
      loading: selectedCategory ? 'Updating category...' : 'Creating category...',
      success: (res) => {
        setIsDialogOpen(false);
        return `Category has been ${selectedCategory ? 'updated' : 'created'}.`;
      },
      error: (err: Error) => err.message,
    });
  };

  const handleDelete = async () => {
    if (!selectedCategory?.id) return;
    toast.promise(deleteItem({ categoryId: selectedCategory.id }), {
      loading: 'Deleting category...',
      success: `Category "${selectedCategory.name}" deleted.`,
      error: (err: Error) => err.message,
    });
    setIsDeleteDialogOpen(false);
  };

  const handleToggleStatus = (category: BlogCategoryDto) => {
    if (!category.id) return;
    
    // DÜZELTME 2: `payload`'dan `categoryId` alanını çıkarıyoruz.
    const payload: UpdateBlogCategoryCommand = { 
        name: category.name, 
        slug: category.slug,
        isActive: !category.isActive 
    };
    toast.promise(updateItem({ categoryId: category.id, data: payload }), {
      loading: 'Updating status...',
      success: 'Status updated.',
      error: (err: Error) => err.message,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blog Categories</h1>
        <Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" />Create Category</Button>
      </div>
      
      <Card><CardContent className="pt-6"><Input placeholder="Search categories..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></CardContent></Card>
      
      <Card>
        <CardHeader><CardTitle>Categories List</CardTitle><CardDescription>{filteredCategories.length} categories found.</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={4} className="text-center"><Loader2 className="animate-spin" /></TableCell></TableRow>
              : filteredCategories.map(cat => (
                <TableRow key={cat.id}>
                  <TableCell>{cat.name}</TableCell>
                  <TableCell><code>{cat.slug}</code></TableCell>
                  <TableCell><Switch checked={!!cat.isActive} onCheckedChange={() => handleToggleStatus(cat)} /></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleOpenDialog(cat)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenDeleteDialog(cat)} className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedCategory ? 'Edit' : 'Create'} Category</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField name="name" control={form.control} render={({field}) => <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>} />
              <FormField name="slug" control={form.control} render={({field}) => <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>} />
              <FormField name="isActive" control={form.control} render={({field}) => <FormItem className="flex items-center gap-2"><FormLabel>Active</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>} />
              <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin"/>}Save</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete {selectedCategory?.name}?</AlertDialogTitle><AlertDialogDescription>This action is permanent.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}