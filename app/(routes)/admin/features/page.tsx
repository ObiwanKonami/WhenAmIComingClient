'use client'

import { useMemo, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { 
  Plus, 
  Edit, 
  Search, 
  Loader2, 
  AlertCircle,
  Settings,
  ToggleLeft,
  Hash,
  LayoutGrid,
  List,
  Copy,
  CheckCircle2,
  Zap,
  Lock,
  Unlock,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { useFeatures, useFeatureOperations } from '@/hooks/useApi'
import type { FeatureDto, CreateFeatureCommand, UpdateFeatureCommand, FeatureType } from '@/lib/api/generated/model'
import { featureFormSchema, type FeatureFormValues, featureTypeEnum } from '@/lib/schemas'

// Çevirici fonksiyonlar, API (sayı) ve UI (string) arasında köprü kurar.
const featureTypeToString = (type?: FeatureType | string): FeatureFormValues['type'] | undefined => {
  if (type == 0) return 'Limit'
  if (type == 1) return 'Boolean'
  return undefined
}

const stringToFeatureType = (type: FeatureFormValues['type']): FeatureType => {
  if (type === 'Limit') return 0
  if (type === 'Boolean') return 1
  throw new Error(`Invalid feature type string: ${type}`)
}

const getFeatureTypeInfo = (type: string | undefined) => {
  switch (type) {
    case 'Limit':
      return {
        label: 'Limit',
        icon: Hash,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        description: 'Numerical limit (e.g., max users, max projects)'
      }
    case 'Boolean':
      return {
        label: 'Boolean',
        icon: ToggleLeft,
        color: 'bg-green-100 text-green-800 border-green-200',
        description: 'On/off feature (enabled or disabled)'
      }
    default:
      return {
        label: 'Unknown',
        icon: Settings,
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        description: 'Unknown feature type'
      }
  }
}

export default function FeaturesPage() {
  const { data: features, isLoading, error: fetchError } = useFeatures()
  const { createItem, isCreating, updateItem, isUpdating } = useFeatureOperations()

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<FeatureDto | null>(null)
  const [copied, setCopied] = useState('')

  const form = useForm<FeatureFormValues>({
    resolver: zodResolver(featureFormSchema),
    defaultValues: { name: '', key: '', type: undefined }
  })

  const isSubmitting = isCreating || isUpdating

  const filteredFeatures = useMemo(() => {
    let filtered = (features ?? []).filter(feature =>
      feature.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.key?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    if (typeFilter === 'limit') {
      filtered = filtered.filter(feature => featureTypeToString(feature.type) === 'Limit')
    } else if (typeFilter === 'boolean') {
      filtered = filtered.filter(feature => featureTypeToString(feature.type) === 'Boolean')
    }
    
    return filtered
  }, [features, searchTerm, typeFilter])

  const limitCount = features?.filter(f => featureTypeToString(f.type) === 'Limit').length ?? 0
  const booleanCount = features?.filter(f => featureTypeToString(f.type) === 'Boolean').length ?? 0

  const handleOpenDialog = (feature?: FeatureDto) => {
    if (feature) {
      setSelectedFeature(feature)
      form.reset({
        name: feature.name ?? '',
        key: feature.key ?? '',
        type: feature.type as FeatureFormValues['type'],
      })
    } else {
      setSelectedFeature(null)
      form.reset({ name: '', key: '', type: undefined })
    }
    setIsDialogOpen(true)
  }

  const onSubmit = async (data: FeatureFormValues) => {
    if (!data.type) {
        toast.error("Validation Error", { description: "Please select a feature type." })
        return
    }

    const promise = selectedFeature
      ? (() => {
          if (typeof selectedFeature.id === 'undefined') return Promise.reject(new Error("Feature ID is missing."))
          const payload: UpdateFeatureCommand = {
            name: data.name,
            type: stringToFeatureType(data.type),
          }
          return updateItem({ featureId: selectedFeature.id, data: payload })
        })()
      : (() => {
          const payload: CreateFeatureCommand = {
            name: data.name,
            key: data.key,
            type: stringToFeatureType(data.type),
          }
          return createItem({ data: payload })
        })()

    toast.promise(promise, {
      loading: selectedFeature ? 'Updating feature...' : 'Creating feature...',
      success: () => { 
        setIsDialogOpen(false)
        return `Feature has been ${selectedFeature ? 'updated' : 'created'}.`
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
          <p className="text-muted-foreground">Loading features...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Plan Features</h1>
          <p className="text-muted-foreground">Define and manage features available in your subscription plans</p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="lg" className="gap-2">
          <Plus className="h-4 w-4" /> 
          Create Feature
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Features</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{features?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Limit Features</CardTitle>
            <Hash className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{limitCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boolean Features</CardTitle>
            <ToggleLeft className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{booleanCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtered</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredFeatures.length}</div>
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
                  placeholder="Search features..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={typeFilter === 'all' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setTypeFilter('all')}
                >
                  All ({features?.length ?? 0})
                </Button>
                <Button 
                  variant={typeFilter === 'limit' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setTypeFilter('limit')}
                >
                  <Hash className="h-3 w-3 mr-1" />
                  Limit ({limitCount})
                </Button>
                <Button 
                  variant={typeFilter === 'boolean' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setTypeFilter('boolean')}
                >
                  <ToggleLeft className="h-3 w-3 mr-1" />
                  Boolean ({booleanCount})
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
              <Settings className="h-5 w-5" />
              Features List
            </CardTitle>
            <CardDescription>
              {filteredFeatures.length} of {features?.length ?? 0} features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature Details</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeatures.length > 0 ? filteredFeatures.map(feature => {
                  const typeInfo = getFeatureTypeInfo(featureTypeToString(feature.type))
                  const TypeIcon = typeInfo.icon
                  
                  return (
                    <TableRow key={feature.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <TypeIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold">{feature.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {typeInfo.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {feature.key}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(feature.key || '', 'Key')}
                            className="h-auto p-1"
                          >
                            {copied === 'Key' ? 
                              <CheckCircle2 className="h-3 w-3 text-green-600" /> : 
                              <Copy className="h-3 w-3" />
                            }
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={typeInfo.color}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleOpenDialog(feature)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                }) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32">
                      <div className="text-center space-y-4">
                        <Settings className="h-12 w-12 text-muted-foreground mx-auto" />
                        <div>
                          <p className="text-lg font-medium">No features found</p>
                          <p className="text-muted-foreground">
                            {searchTerm ? 'Try adjusting your search terms' : 'Create your first feature to get started'}
                          </p>
                        </div>
                        {!searchTerm && (
                          <Button onClick={() => handleOpenDialog()}>
                            <Plus className="h-4 w-4 mr-2" /> Create First Feature
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
          {filteredFeatures.map((feature) => {
            const typeInfo = getFeatureTypeInfo(featureTypeToString(feature.type))
            const TypeIcon = typeInfo.icon
            
            return (
              <Card key={feature.id} className="hover:shadow-lg transition-shadow group">
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-xl bg-primary/10 w-fit">
                      <TypeIcon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge className={typeInfo.color}>
                      {typeInfo.label}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg leading-tight">{feature.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {typeInfo.description}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Feature Key
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono flex-1">
                        {feature.key}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(feature.key || '', feature.key || '')}
                        className="h-auto p-2"
                      >
                        {copied === feature.key ? 
                          <CheckCircle2 className="h-3 w-3 text-green-600" /> : 
                          <Copy className="h-3 w-3" />
                        }
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleOpenDialog(feature)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Feature
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {filteredFeatures.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="text-center py-12">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No features found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Try adjusting your search terms' : 'Create your first feature to define plan capabilities'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" /> Create First Feature
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
              <Settings className="h-5 w-5" />
              {selectedFeature ? 'Edit Feature' : 'Create New Feature'}
            </DialogTitle>
            <DialogDescription>
              {selectedFeature ? 
                'Update the feature name and type' : 
                'Define a new feature that can be included in subscription plans'
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <div className="space-y-6 py-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Feature Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="e.g., Number of Users, Advanced Analytics" 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    A human-readable name that describes what this feature provides
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              
              {!selectedFeature && (
                <FormField control={form.control} name="key" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feature Key</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="e.g., MAX_USERS, ADVANCED_ANALYTICS" 
                        disabled={isSubmitting}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormDescription>
                      A unique identifier used in code. Use UPPERCASE with underscores (cannot be changed later)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Feature Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select feature type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {featureTypeEnum.options.map(type => {
                        const typeInfo = getFeatureTypeInfo(type)
                        const TypeIcon = typeInfo.icon
                        return (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              <TypeIcon className="h-4 w-4" />
                              <span>{type}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Hash className="h-3 w-3 text-blue-600" />
                        <strong>Limit:</strong> Numerical limits (e.g., max users: 10, max projects: 5)
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <ToggleLeft className="h-3 w-3 text-green-600" />
                        <strong>Boolean:</strong> On/off features (e.g., analytics enabled: yes/no)
                      </div>
                    </div>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            
            <DialogFooter>
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
                {isSubmitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                {selectedFeature ? 'Save Changes' : 'Create Feature'}
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}