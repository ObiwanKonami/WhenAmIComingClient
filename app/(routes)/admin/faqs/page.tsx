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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Search, 
  Loader2, 
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronRight,
  Filter,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { useFaqs, useFaqOperations } from '@/hooks/useApi'
import type { FaqDto, CreateFaqCommand, UpdateFaqCommand } from '@/lib/api/generated/model'
import { faqFormSchema, type FaqFormValues } from '@/lib/schemas'

export default function FaqsPage() {
  const { data: faqs, isLoading, error: fetchError } = useFaqs()
  const { 
    createItem: createFaq, isCreating,
    updateItem: updateFaq, isUpdating,
    deleteItem: deleteFaq, isDeleting,
  } = useFaqOperations()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'accordion'>('table')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedFaq, setSelectedFaq] = useState<FaqDto | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [copied, setCopied] = useState('')

  const form = useForm<FaqFormValues>({
    resolver: zodResolver(faqFormSchema),
    defaultValues: {
      question: '', answer: '', isActive: true
    }
  })

  const isSubmitting = isCreating || isUpdating

  const filteredFaqs = useMemo(() => {
    let filtered = (faqs ?? []).filter(faq => 
      faq.question?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      faq.answer?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    if (statusFilter === 'active') {
      filtered = filtered.filter(faq => faq.isActive)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(faq => !faq.isActive)
    }
    
    return filtered
  }, [faqs, searchTerm, statusFilter])

  const activeCount = faqs?.filter(f => f.isActive).length ?? 0
  const inactiveCount = faqs?.filter(f => !f.isActive).length ?? 0

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const expandAll = () => {
    const allIds = new Set(filteredFaqs.map(faq => faq.id).filter(id => id !== undefined) as number[])
    setExpandedItems(allIds)
  }

  const collapseAll = () => {
    setExpandedItems(new Set())
  }

  const openDialog = (faq?: FaqDto) => {
    if (faq) {
      setSelectedFaq(faq)
      form.reset({
        question: faq.question ?? "",
        answer: faq.answer ?? "",
        isActive: faq.isActive ?? true,
      })
    } else {
      setSelectedFaq(null)
      form.reset({
        question: '', answer: '', isActive: true
      })
    }
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (faq: FaqDto) => {
    setSelectedFaq(faq)
    setIsDeleteDialogOpen(true)
  }

  const onSubmit = async (data: FaqFormValues) => {
    const promise = selectedFaq
      ? (() => {
        if (typeof selectedFaq.id === 'undefined') throw new Error("FAQ ID is missing.")
        const payload: UpdateFaqCommand = {
          question: data.question,
          answer: data.answer,
          isActive: data.isActive,
          sortOrder: selectedFaq.sortOrder ?? 0,
        }
        return updateFaq({ faqId: selectedFaq.id, data: payload })
      })()
      : (() => {
        const payload: CreateFaqCommand = { ...data, sortOrder: 0 }
        return createFaq({ data: payload })
      })()

    toast.promise(promise, {
      loading: selectedFaq ? 'Updating FAQ...' : 'Creating FAQ...',
      success: () => {
        setIsDialogOpen(false)
        return `FAQ has been ${selectedFaq ? 'updated' : 'created'} successfully.`
      },
      error: (err) => (err as Error).message,
    })
  }

  const handleDeleteFaq = async () => {
    if (!selectedFaq || typeof selectedFaq.id === 'undefined') return
    
    toast.promise(deleteFaq({ faqId: selectedFaq.id }), {
      loading: 'Deleting FAQ...',
      success: `FAQ "${selectedFaq.question}" has been deleted.`,
      error: (err) => (err as Error).message,
    })
    setIsDeleteDialogOpen(false)
  }

  const handleToggleStatus = async (faq: FaqDto) => {
    if (typeof faq.id === 'undefined') return toast.error("Update Failed: FAQ ID is missing.")

    const payload: UpdateFaqCommand = {
      question: faq.question ?? '', 
      answer: faq.answer ?? '', 
      isActive: !faq.isActive,
      sortOrder: faq.sortOrder ?? 0
    }
    
    toast.promise(updateFaq({ faqId: faq.id, data: payload }), {
      loading: 'Updating status...',
      success: `Status changed to ${!faq.isActive ? 'Active' : 'Inactive'}.`,
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
          <p className="text-muted-foreground">Loading FAQs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">FAQs</h1>
          <p className="text-muted-foreground">Manage frequently asked questions for your website</p>
        </div>
        <Button onClick={() => openDialog()} size="lg" className="gap-2">
          <Plus className="h-4 w-4" /> 
          Create FAQ
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total FAQs</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{faqs?.length ?? 0}</div>
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
            <div className="text-2xl font-bold">{filteredFaqs.length}</div>
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
                  placeholder="Search FAQs..." 
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
                  All ({faqs?.length ?? 0})
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
            <div className="flex items-center gap-2">
              <Button 
                variant={viewMode === 'table' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'accordion' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('accordion')}
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
              <MessageSquare className="h-5 w-5" />
              FAQs List
            </CardTitle>
            <CardDescription>
              {filteredFaqs.length} of {faqs?.length ?? 0} FAQs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Question & Answer</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaqs.length > 0 ? filteredFaqs.map((faq, index) => (
                  <TableRow key={faq.id} className={!faq.isActive ? 'opacity-75' : ''}>
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 mt-1">
                            <HelpCircle className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base leading-tight">{faq.question}</h4>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <Badge variant={faq.isActive ? 'default' : 'secondary'} className="w-fit">
                          {faq.isActive ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" /> Active</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                          )}
                        </Badge>
                        <Switch
                          checked={!!faq.isActive}
                          onCheckedChange={() => handleToggleStatus(faq)}
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
                          <DropdownMenuItem onClick={() => openDialog(faq)}>
                            <Edit className="mr-2 h-4 w-4" /> 
                            Edit FAQ
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => copyToClipboard(faq.question || '', 'Question')}
                          >
                            <Copy className="mr-2 h-4 w-4" /> 
                            Copy Question
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(faq)} 
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
                        <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                        <div>
                          <p className="text-lg font-medium">No FAQs found</p>
                          <p className="text-muted-foreground">
                            {searchTerm ? 'Try adjusting your search terms' : 'Create your first FAQ to get started'}
                          </p>
                        </div>
                        {!searchTerm && (
                          <Button onClick={() => openDialog()}>
                            <Plus className="h-4 w-4 mr-2" /> Create First FAQ
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  FAQs Preview
                </CardTitle>
                <CardDescription>
                  {filteredFaqs.length} FAQs • Interactive preview mode
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={expandAll}>
                  Expand All
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll}>
                  Collapse All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredFaqs.length > 0 ? filteredFaqs.map((faq, index) => (
              <Card key={faq.id} className={`${!faq.isActive ? 'opacity-75' : ''}`}>
                <Collapsible 
                  open={expandedItems.has(faq.id!)} 
                  onOpenChange={() => toggleExpanded(faq.id!)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-mono bg-muted px-2 py-1 rounded">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-left">{faq.question}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={faq.isActive ? 'default' : 'secondary'}>
                              {faq.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {expandedItems.has(faq.id!) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <div className="pl-4 border-l-2 border-muted">
                          <p className="text-muted-foreground whitespace-pre-wrap">{faq.answer}</p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={!!faq.isActive}
                              onCheckedChange={() => handleToggleStatus(faq)}
                              disabled={isUpdating}
                            />
                            <span className="text-sm text-muted-foreground">
                              {faq.isActive ? 'Visible to users' : 'Hidden from users'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openDialog(faq)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => copyToClipboard(faq.question || '', 'Question')}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openDeleteDialog(faq)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )) : (
              <Card>
                <CardContent className="text-center py-12">
                  <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No FAQs found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? 'Try adjusting your search terms' : 'Create your first FAQ to get started'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => openDialog()}>
                      <Plus className="h-4 w-4 mr-2" /> Create First FAQ
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              {selectedFaq ? 'Edit FAQ' : 'Create New FAQ'}
            </DialogTitle>
            <DialogDescription>
              {selectedFaq ? 'Update the question and answer' : 'Add a new frequently asked question'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <div className="space-y-6 flex-1 overflow-hidden">
              <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
                <FormField control={form.control} name="question" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        disabled={isSubmitting} 
                        placeholder="What is your refund policy?"
                      />
                    </FormControl>
                    <FormDescription>
                      Write a clear, concise question that users commonly ask
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="answer" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Answer</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={8} 
                        disabled={isSubmitting}
                        placeholder="Our refund policy allows..."
                        className="resize-none"
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a detailed, helpful answer to the question
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Publish FAQ
                      </FormLabel>
                      <FormDescription>
                        Make this FAQ visible to users on your website
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
                  {selectedFaq ? 'Save Changes' : 'Create FAQ'}
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
              Delete FAQ
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "<strong>{selectedFaq?.question}</strong>"? 
              This action cannot be undone and the FAQ will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteFaq} 
              disabled={isDeleting} 
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete FAQ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}