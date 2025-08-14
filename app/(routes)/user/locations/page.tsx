'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { 
  MoreHorizontal, 
  Plus, 
  Trash2, 
  Edit, 
  MapPin, 
  AlertCircle, 
  Loader2,
  Search,
  Phone,
  Map,
  CheckCircle2,
  XCircle,
  Building2
} from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { useBusiness, useLocations, useLocationOperations } from '@/hooks/useApi'
import type { LocationDto, UpdateLocationCommand, CreateLocationCommand } from '@/lib/api/generated/model'
import { type LocationFormValues } from '@/lib/schemas'
import { LocationForm } from './location-form'

export default function LocationsPage() {
  // Data and Operation Hooks
  const { data: businessData, error: businessError } = useBusiness();
  const myBusiness = useMemo(() => Array.isArray(businessData) ? businessData[0] : businessData, [businessData]);
  const businessId = myBusiness?.id;

  const { data: locations, isLoading, error: locationsError } = useLocations(businessId!, { query: { enabled: !!businessId } });
  const { createItem, updateItem, deleteItem, isCreating, isUpdating, isDeleting } = useLocationOperations(businessId!);

  // State Management
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationDto | null>(null);

  const isSubmitting = isCreating || isUpdating;
  const fetchError = businessError || locationsError;

  // Filter locations by search term
  const filteredLocations = useMemo(() => {
    if (!locations) return []
    return locations.filter(location =>
      location.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (location as any).phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.address?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [locations, searchTerm])

  // Statistics
  const stats = useMemo(() => {
    const total = locations?.length ?? 0
    const active = locations?.filter(l => l.isActive).length ?? 0
    const inactive = total - active
    
    return { total, active, inactive }
  }, [locations])

  // Event Handlers
  const handleOpenDialog = (location?: LocationDto) => {
    setSelectedLocation(location || null);
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (location: LocationDto) => {
    setSelectedLocation(location);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (data: LocationFormValues) => {
    if (!businessId) {
      toast.error("Business not found. Cannot perform operation.");
      return;
    }

    const promise = selectedLocation
      ? updateItem({ businessId, locationId: selectedLocation.id!, data: data as UpdateLocationCommand })
      : createItem({ businessId, data: data as CreateLocationCommand });

    toast.promise(promise, {
      loading: selectedLocation ? 'Updating location...' : 'Creating location...',
      success: () => {
        setIsDialogOpen(false);
        return `Location has been ${selectedLocation ? 'updated' : 'created'} successfully.`;
      },
      error: (err) => (err as Error).message,
    });
  };

  const handleDelete = async () => {
    if (!selectedLocation || !businessId) return;

    toast.promise(deleteItem({ businessId, locationId: selectedLocation.id! }), {
      loading: 'Deleting location...',
      success: () => {
        setIsDeleteDialogOpen(false);
        return `Location "${selectedLocation.name}" has been deleted.`;
      },
      error: (err) => (err as Error).message,
    });
  };

  if (isLoading && !locations) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading locations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
          <p className="text-muted-foreground">Manage your business locations and branches</p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          Create Location
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All business locations</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">Visible to customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hidden Locations</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground mt-1">Not visible to customers</p>
          </CardContent>
        </Card>
      </div>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load locations: {(fetchError as Error).message}
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      {stats.total > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Business Locations
          </CardTitle>
          <CardDescription>
            {filteredLocations.length} of {stats.total} locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Location Details</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && filteredLocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32">
                    <div className="flex items-center justify-center space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredLocations.length > 0 ? (
                filteredLocations.map((location, index) => (
                  <TableRow key={location.id} className={!location.isActive ? 'opacity-75' : ''}>
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{location.name}</h4>
                            {location.address && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Map className="h-3 w-3" />
                                {location.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(location as any).phone ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{(location as any).phone}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No phone</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={location.isActive ? 'default' : 'secondary'}
                        className={location.isActive 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        }
                      >
                        {location.isActive ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Active</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Hidden</>
                        )}
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
                          <DropdownMenuItem onClick={() => handleOpenDialog(location)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Location
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleOpenDeleteDialog(location)} 
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32">
                    <div className="text-center space-y-4">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="text-lg font-medium">No locations found</p>
                        <p className="text-muted-foreground">
                          {searchTerm 
                            ? 'Try adjusting your search terms' 
                            : 'Create your first business location to get started'
                          }
                        </p>
                      </div>
                      {!searchTerm && (
                        <Button onClick={() => handleOpenDialog()}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Location
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedLocation ? 'Edit Location' : 'Create New Location'}
            </DialogTitle>
          </DialogHeader>
          <LocationForm
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            initialData={selectedLocation ? {
              name: selectedLocation.name ?? '',
              phone: (selectedLocation as any).phone || '',
              address: selectedLocation.address || '',
              isActive: selectedLocation.isActive ?? true, 
            } : undefined}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Location
            </AlertDialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete "<strong>{selectedLocation?.name}</strong>"? 
              This action cannot be undone and the location will be permanently removed.
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
              Delete Location
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}