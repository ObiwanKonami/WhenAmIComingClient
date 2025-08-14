'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { MoreHorizontal, Plus, Trash2, Edit, User, AlertCircle, Loader2, Image as ImageIcon, Link as LinkIcon, Users, Check, ChevronsUpDown } from 'lucide-react'
import {
  useBusiness,
  useStaff,
  useStaffOperations,
  useServices,
  useLocations
} from '@/hooks/useApi'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from '@/lib/utils'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { staffFormSchema, StaffFormValues } from '@/lib/schemas'

// DTO isimlerini, auto-generate edilen dosyadaki gerçek isimleriyle değiştiriyoruz.
import type { StaffDto, ServiceDto, LocationDto, CreateStaffCommand, UpdateStaffCommand } from '@/lib/api/generated/model'

// Bu component'in içeriğini daha sonra dolduracağız.
function StaffWorkingHoursForm({ staffId }: { staffId: number }) {
    return <div className="p-4 border rounded-lg">Working Hours for Staff ID: {staffId} will be managed here.</div>
}

export default function StaffPage() {
  const { data: businessData } = useBusiness();
  const myBusiness = useMemo(() => Array.isArray(businessData) ? businessData[0] : businessData, [businessData]);
  const businessId = myBusiness?.id;

  const { data: staffList, isLoading: isLoadingStaff } = useStaff(businessId!, { query: { enabled: !!businessId } });
  const { data: services = [], isLoading: isLoadingServices } = useServices(businessId!, { query: { enabled: !!businessId } });
  const { data: locations = [], isLoading: isLoadingLocations } = useLocations(businessId!, { query: { enabled: !!businessId } });
  
  const { createItem, updateItem, deleteItem, assignServices, isCreating, isUpdating, isDeleting, isAssigning } = useStaffOperations(businessId!);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffDto | null>(null);

  const isLoading = isLoadingStaff || isLoadingServices || isLoadingLocations;
  const isSubmitting = isCreating || isUpdating || isAssigning;

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
  });

  const handleOpenDialog = (staff?: StaffDto) => {
    setSelectedStaff(staff || null);
    if (staff) {
      form.reset({
        // DÜZELTME 1: `name` null ise boş string ata
        name: staff.name ?? '', 
        email: staff.email || '',
        phone: staff.phone || '',
        imageUrl: staff.imageUrl || '',
        isActive: staff.isActive,
        serviceIds: (staff as any).serviceIds || [],
        locationIds: (staff as any).locationIds || [],
      });
    } else {
      form.reset({
        name: '', email: '', phone: '', imageUrl: '', isActive: true, serviceIds: [], locationIds: [],
      });
    }
    setIsDialogOpen(true);
  };
  
  const handleOpenDeleteDialog = (staff: StaffDto) => {
    setSelectedStaff(staff);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (data: StaffFormValues) => {
    if (!businessId) return toast.error("Business not found.");

    try {
        let staffId: number;

        if (selectedStaff && selectedStaff.id) { // DÜZELTME 2: `id`'nin varlığını kontrol et
            // Update Staff
            await updateItem({ businessId, staffId: selectedStaff.id, data: data as UpdateStaffCommand });
            staffId = selectedStaff.id;
        } else {
            // Create Staff
            const response: any = await createItem({ businessId, data: data as CreateStaffCommand });
            staffId = response.id;
        }

        // `assignServices` hook'u body'de `serviceIds` bekliyorsa, bunu bir nesne içine almalıyız.
        // Eğer doğrudan bir dizi bekliyorsa: `data.serviceIds || []` yeterli olacaktır.
        // Komut dosyanıza göre `data: data.serviceIds || []` olarak da değiştirebilirsiniz.
        await assignServices({ businessId, staffId, data: data.serviceIds || []});
        
        // TODO: Assign Locations
        
        toast.success(`Staff member has been ${selectedStaff ? 'updated' : 'created'} successfully.`);
        setIsDialogOpen(false);
    } catch (err) {
        toast.error((err as Error).message);
    }
  };

  const handleDelete = async () => {
    // DÜZELTME 2: `id`'nin varlığını kontrol et
    if (!selectedStaff || !selectedStaff.id || !businessId) return; 
    toast.promise(deleteItem({ businessId, staffId: selectedStaff.id }), {
      loading: 'Deleting staff member...',
      success: () => {
        setIsDeleteDialogOpen(false);
        return 'Staff member has been deleted.';
      },
      error: (err) => (err as Error).message,
    });
  };
  
  const getInitials = (name?: string | null) => (name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Staff</h1>
        <Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" /> Create New</Button>
      </div>

      <Card>
          <CardHeader>
              <CardTitle>Staff Members</CardTitle>
              <CardDescription>Manage your team members and their assigned services.</CardDescription>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Services</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                        <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                    ) : Array.isArray(staffList) && staffList.length > 0 ? (
                      staffList.map((staff, index) => (
                        <TableRow key={staff.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={staff.imageUrl || undefined} />
                                    <AvatarFallback>{getInitials(staff.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">{staff.name}</div>
                                    <div className="text-sm text-muted-foreground">{staff.email}</div>
                                    <div className="text-sm text-muted-foreground">{staff.phone}</div>
                                </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{(staff as any).serviceIds?.length || 0} services</Badge>
                          </TableCell>
                          <TableCell>
                              <Badge variant={staff.isActive ? 'default' : 'outline'}>
                                  {staff.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleOpenDialog(staff)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleOpenDeleteDialog(staff)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                        <TableRow><TableCell colSpan={5} className="text-center h-24">No staff members found.</TableCell></TableRow>
                    )}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>

       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                  <DialogTitle>{selectedStaff ? 'Edit Staff Member' : 'Create New Staff Member'}</DialogTitle>
                  <DialogDescription>Fill in the details for the staff member.</DialogDescription>
              </DialogHeader>
                <Tabs defaultValue="details">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="details">Staff Details</TabsTrigger>
                        <TabsTrigger value="working-hours" disabled={!selectedStaff}>Working Hours</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details">
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <div><Label htmlFor="name">Name *</Label><Input id="name" {...form.register('name')} />{form.formState.errors.name && <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>}</div>
                                    <div><Label htmlFor="email">Email</Label><Input id="email" type="email" {...form.register('email')} /></div>
                                    <div><Label htmlFor="phone">Phone</Label><Input id="phone" {...form.register('phone')} /></div>
                                </div>
                                <div className="space-y-6">
                                     <div><Label htmlFor="imageUrl">Image URL</Label><Input id="imageUrl" {...form.register('imageUrl')} placeholder="https://example.com/image.png" /></div>
                                    <div>
                                        <Label>Services</Label>
                                        <Controller
                                            control={form.control}
                                            name="serviceIds"
                                            render={({ field }) => (
                                                <MultiSelectPopover
                                                    title="Services"
                                                    // DÜZELTME 3: `services` null değilse `.map` yap
                                                    options={Array.isArray(services) ? services.map(s => ({ value: s.id!, label: s.name! })) : []}
                                                    selectedValues={field.value || []}
                                                    onChange={field.onChange}
                                                />
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <Label>Locations</Label>
                                        <Controller
                                            control={form.control}
                                            name="locationIds"
                                            render={({ field }) => (
                                                <MultiSelectPopover
                                                    title="Locations"
                                                     // DÜZELTME 3: `locations` null değilse `.map` yap
                                                    options={Array.isArray(locations) ? locations.map(l => ({ value: l.id!, label: l.name! })) : []}
                                                    selectedValues={field.value || []}
                                                    onChange={field.onChange}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Controller control={form.control} name="isActive" render={({ field }) => (<Checkbox id="isActive" checked={field.value} onCheckedChange={field.onChange} />)} />
                                <Label htmlFor="isActive">Staff member is Active</Label>
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </TabsContent>
                    <TabsContent value="working-hours">
                         {/* DÜZELTME 2: `selectedStaff.id`'nin varlığını kontrol et */}
                        {selectedStaff && selectedStaff.id && <StaffWorkingHoursForm staffId={selectedStaff.id} />}
                    </TabsContent>
                </Tabs>
          </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the staff member "<strong>{selectedStaff?.name}</strong>".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/80">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}

function MultiSelectPopover({ title, options, selectedValues, onChange }: {
    title: string;
    options: { value: number; label: string }[];
    selectedValues: number[];
    onChange: (values: number[]) => void;
}) {
    const [open, setOpen] = useState(false);
    const selectedLabels = options.filter(opt => selectedValues.includes(opt.value)).map(opt => opt.label).join(', ');

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                    <span className="truncate">{selectedLabels || `Select ${title}...`}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder={`Search ${title}...`} />
                    <CommandEmpty>No {title.toLowerCase()} found.</CommandEmpty>
                    <CommandGroup className="max-h-48 overflow-y-auto">
                        {options.map((option) => (
                            <CommandItem
                                key={option.value}
                                value={option.label}
                                onSelect={() => {
                                    const newValues = selectedValues.includes(option.value)
                                        ? selectedValues.filter((v) => v !== option.value)
                                        : [...selectedValues, option.value];
                                    onChange(newValues);
                                }}
                            >
                                <Check className={cn("mr-2 h-4 w-4", selectedValues.includes(option.value) ? "opacity-100" : "opacity-0")} />
                                {option.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}