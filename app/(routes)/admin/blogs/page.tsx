'use client'

import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from 'next/image'
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Plus, 
  MoreHorizontal, 
  Loader2, 
  AlertCircle, 
  Image as ImageIcon,
  Search,
  Edit,
  Trash2,
  FileText,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useBlogPosts, useBlogPostOperations, useBlogCategories, useUploadOperations } from '@/hooks/useApi';
import type { BlogPostDto, CreateBlogPostCommand, UpdateBlogPostCommand, PostApiUploadImageBody } from '@/lib/api/generated/model';
import { blogPostFormSchema, type BlogPostFormValues } from '@/lib/schemas';

export default function BlogPostsPage() {
  const { data: posts, isLoading: isLoadingPosts, error: postsError } = useBlogPosts();
  const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useBlogCategories();
  const { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting } = useBlogPostOperations();
  const { mutateAsync: uploadImage, isPending: isUploading } = useUploadOperations();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPostDto | null>(null);

  const isLoading = isLoadingPosts || isLoadingCategories;
  const fetchError = postsError || categoriesError;
  const isSubmitting = isCreating || isUpdating || isUploading;

  const postsWithCategoryName = useMemo(() => {
    if (!posts || !categories) return [];
    const categoriesMap = new Map(categories.map(c => [c.id, c.name]));
    return posts.map(post => ({
      ...post,
      categoryName: categoriesMap.get(post.blogCategoryId) ?? 'Uncategorized'
    }));
  }, [posts, categories]);

  const filteredPosts = useMemo(() => {
    let filtered = postsWithCategoryName.filter(post =>
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter === 'published') {
      filtered = filtered.filter(post => post.isPublished);
    } else if (statusFilter === 'draft') {
      filtered = filtered.filter(post => !post.isPublished);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(post => post.blogCategoryId === Number(categoryFilter));
    }

    return filtered;
  }, [postsWithCategoryName, searchTerm, statusFilter, categoryFilter]);

  const publishedCount = posts?.filter(p => p.isPublished).length ?? 0;
  const draftCount = posts?.filter(p => !p.isPublished).length ?? 0;

  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostFormSchema),
    defaultValues: { title: '', slug: '', content: '', featuredImageUrl: '', isPublished: true, blogCategoryId: 0 },
  });

  const openDialog = (post?: BlogPostDto) => {
    if (post) {
      setSelectedPost(post);
      form.reset({
        title: post.title ?? '',
        slug: post.slug ?? '',
        content: post.content ?? '',
        featuredImageUrl: post.featuredImageUrl ?? '',
        isPublished: !!post.isPublished,
        blogCategoryId: post.blogCategoryId ?? 0,
      });
    } else {
      setSelectedPost(null);
      form.reset({ title: '', slug: '', content: '', featuredImageUrl: '', isPublished: true, blogCategoryId: 0 });
    }
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (post: BlogPostDto) => {
    setSelectedPost(post);
    setIsDeleteDialogOpen(true);
  };

  const handleTogglePublished = (post: BlogPostDto) => {
    if (typeof post.id === 'undefined') return toast.error("Update failed: Post ID is missing.");
    
    const payload: UpdateBlogPostCommand = {
        title: post.title,
        slug: post.slug,
        content: post.content,
        featuredImageUrl: post.featuredImageUrl,
        isPublished: !post.isPublished,
        blogCategoryId: post.blogCategoryId,
    };

    toast.promise(updateItem({ postId: post.id, data: payload }), {
      loading: 'Updating status...',
      success: `Status changed to ${!post.isPublished ? 'Published' : 'Draft'}.`,
      error: (err) => (err as Error).message,
    });
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const payload: PostApiUploadImageBody = { file };
    toast.promise(uploadImage({ data: payload }), {
      loading: 'Uploading image...',
      success: (data) => {
        form.setValue('featuredImageUrl', (data as any)?.url || '', { shouldValidate: true });
        return 'Image uploaded!';
      },
      error: (err: Error) => err.message,
    });
  };

  const onSubmit = async (data: BlogPostFormValues) => {
    const promise = selectedPost
      ? (() => {
        if (!selectedPost?.id) throw new Error("Post ID is missing.");
        const payload: UpdateBlogPostCommand = data;
        return updateItem({ postId: selectedPost.id, data: payload });
      })()
      : (() => {
        const payload: CreateBlogPostCommand = data;
        return createItem({ data: payload });
      })();

    toast.promise(promise, {
      loading: selectedPost ? 'Updating post...' : 'Creating post...',
      success: () => { 
        setIsDialogOpen(false); 
        return `Post has been ${selectedPost ? 'updated' : 'created'} successfully.`;
      },
      error: (err: Error) => err.message,
    });
  };

  const handleDelete = async () => {
    if (!selectedPost?.id) return;
    toast.promise(deleteItem({ postId: selectedPost.id }), {
      loading: 'Deleting post...',
      success: `Post "${selectedPost.title}" has been deleted.`,
      error: (err: Error) => err.message,
    });
    setIsDeleteDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-muted-foreground">Manage your blog posts and articles</p>
        </div>
        <Button onClick={() => openDialog()} size="lg" className="gap-2">
          <Plus className="h-4 w-4" /> 
          Create Post
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{publishedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
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
            <div className="text-2xl font-bold">{filteredPosts.length}</div>
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
                  placeholder="Search posts..." 
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
                  All ({posts?.length ?? 0})
                </Button>
                <Button 
                  variant={statusFilter === 'published' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setStatusFilter('published')}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Published ({publishedCount})
                </Button>
                <Button 
                  variant={statusFilter === 'draft' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setStatusFilter('draft')}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Drafts ({draftCount})
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map(cat => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Posts List
          </CardTitle>
          <CardDescription>
            {filteredPosts.length} of {posts?.length ?? 0} posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Post Details</TableHead>
                <TableHead className="w-[120px]">Category</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.length > 0 ? filteredPosts.map((post) => (
                <TableRow key={post.id} className={!post.isPublished ? 'opacity-75' : ''}>
                  <TableCell>
                    <div className="w-16 h-10 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                      {post.featuredImageUrl ? (
                        <Image 
                          src={post.featuredImageUrl} 
                          alt={post.title ?? 'Post image'} 
                          width={64} 
                          height={40} 
                          className="rounded-md object-cover h-full w-full" 
                        />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-base leading-tight">{post.title}</h4>
                      <p className="text-sm text-muted-foreground">/{post.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{post.categoryName}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <Badge variant={post.isPublished ? 'default' : 'secondary'} className="w-fit">
                        {post.isPublished ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Published</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Draft</>
                        )}
                      </Badge>
                      <Switch
                        checked={!!post.isPublished}
                        onCheckedChange={() => handleTogglePublished(post)}
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
                        <DropdownMenuItem onClick={() => openDialog(post)}>
                          <Edit className="mr-2 h-4 w-4" /> 
                          Edit Post
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(post)} 
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
                  <TableCell colSpan={5} className="h-32">
                    <div className="text-center space-y-4">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="text-lg font-medium">No posts found</p>
                        <p className="text-muted-foreground">
                          {searchTerm ? 'Try adjusting your search terms' : 'Create your first blog post to get started'}
                        </p>
                      </div>
                      {!searchTerm && (
                        <Button onClick={() => openDialog()}>
                          <Plus className="h-4 w-4 mr-2" /> Create First Post
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
              <FileText className="h-5 w-5" />
              {selectedPost ? 'Edit Post' : 'Create New Post'}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <div className="space-y-6 flex-1 overflow-hidden">
              <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
                <FormField 
                  name="title" 
                  control={form.control} 
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isSubmitting} placeholder="Enter post title..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
                
                <FormField 
                  name="slug" 
                  control={form.control} 
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isSubmitting} placeholder="url-friendly-slug" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />

                <FormField 
                  name="blogCategoryId" 
                  control={form.control} 
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={v => field.onChange(Number(v))} value={String(field.value)} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map(c => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} 
                />

                <FormField 
                  name="content" 
                  control={form.control} 
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={10} 
                          disabled={isSubmitting}
                          placeholder="Write your post content here..."
                          className="resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />

                <FormField 
                  name="featuredImageUrl" 
                  control={form.control} 
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Featured Image</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input 
                            type="file" 
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={isUploading || isSubmitting}
                          />
                          {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                          {field.value && (
                            <Image 
                              src={field.value} 
                              alt="preview" 
                              width={100} 
                              height={60} 
                              className="mt-2 rounded-md object-cover"
                            />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />

                <FormField 
                  name="isPublished" 
                  control={form.control} 
                  render={({field}) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Publish Post
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Make this post visible to readers
                        </p>
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
                  {selectedPost ? 'Save Changes' : 'Create Post'}
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
              Delete Post
            </AlertDialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete "<strong>{selectedPost?.title}</strong>"? 
              This action cannot be undone and the post will be permanently removed.
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
              Delete Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}