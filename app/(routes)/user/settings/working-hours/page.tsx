'use client'

import { useState, useEffect } from 'react'
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  PlusCircle, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  Clock, 
  Calendar,
  Coffee,
  CheckCircle2,
  XCircle,
  Sun,
  Moon
} from 'lucide-react'
import { useBusiness, useWorkingHours, useWorkingHourOperations } from '@/hooks/useApi'
import { toast } from 'sonner'
import type { WorkingHourDto, CreateWorkingHourCommand, UpdateWorkingHourCommand, DayOfWeek } from '@/lib/api/generated/model'

// UI state tipleri
type TimeSlot = { id?: number; start: string; end: string; };
type DaySchedule = { isActive: boolean; workSlot: TimeSlot; breaks: TimeSlot[]; };
type ScheduleState = Record<number, DaySchedule>;

// Günler ve ikonları
const DAYS_CONFIG = [
  { name: 'Sunday', displayName: 'Pazar', icon: Sun, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { name: 'Monday', displayName: 'Pazartesi', icon: Calendar, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { name: 'Tuesday', displayName: 'Salı', icon: Calendar, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { name: 'Wednesday', displayName: 'Çarşamba', icon: Calendar, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { name: 'Thursday', displayName: 'Perşembe', icon: Calendar, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  { name: 'Friday', displayName: 'Cuma', icon: Calendar, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { name: 'Saturday', displayName: 'Cumartesi', icon: Moon, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
];

const dayNameToIndexMap: { [key: string]: number } = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6
};

const createInitialSchedule = (): ScheduleState => {
  const schedule: ScheduleState = {};
  DAYS_CONFIG.forEach((_, index) => {
    schedule[index] = { isActive: false, workSlot: { start: '09:00', end: '17:00' }, breaks: [] };
  });
  return schedule;
};

export default function WorkingHoursPage() {
  const { data: businessData, error: businessError } = useBusiness();
  const myBusiness = Array.isArray(businessData) ? businessData[0] : businessData;
  const businessId = myBusiness?.id;
  
  const { data: initialWorkingHours, isLoading, error } = useWorkingHours(businessId!, undefined, { query: { enabled: !!businessId } });
  const { createItem, updateItem, deleteItem, isCreating, isUpdating, isDeleting } = useWorkingHourOperations(businessId!);

  const [schedule, setSchedule] = useState<ScheduleState>(createInitialSchedule);
  const isSaving = isCreating || isUpdating || isDeleting;
  const fetchError = businessError || error;

  useEffect(() => {
    if (initialWorkingHours && initialWorkingHours.length > 0) {
      const newSchedule = createInitialSchedule();
      initialWorkingHours.forEach(wh => {
        const dayIndex = dayNameToIndexMap[wh.dayOfWeek as string];

        if (typeof dayIndex === 'number') {
          newSchedule[dayIndex].isActive = true;
          const slot: TimeSlot = { id: wh.id, start: wh.startTime ?? '', end: wh.endTime ?? '' };
          
          if (wh.isBreak) {
            newSchedule[dayIndex].breaks.push(slot);
          } else {
            newSchedule[dayIndex].workSlot = slot;
          }
        }
      });
      setSchedule(newSchedule);
    }
  }, [initialWorkingHours]);

  // İstatistikler
  const stats = {
    activeDays: Object.values(schedule).filter(day => day.isActive).length,
    totalBreaks: Object.values(schedule).reduce((total, day) => total + day.breaks.length, 0),
    averageHours: Object.values(schedule)
      .filter(day => day.isActive)
      .reduce((total, day) => {
        const start = new Date(`2000-01-01T${day.workSlot.start}:00`);
        const end = new Date(`2000-01-01T${day.workSlot.end}:00`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }, 0) / Object.values(schedule).filter(day => day.isActive).length || 0
  };

  const handleToggleDay = (dayIndex: number, isActive: boolean) => {
    setSchedule(prev => ({ ...prev, [dayIndex]: { ...prev[dayIndex], isActive } }));
  };

  const handleTimeChange = (dayIndex: number, type: 'workSlot' | 'break', value: string, field: 'start' | 'end', breakIndex?: number) => {
    setSchedule(prev => {
      const newDay = { ...prev[dayIndex] };
      if (type === 'workSlot') newDay.workSlot = { ...newDay.workSlot, [field]: value };
      else if (type === 'break' && breakIndex !== undefined) newDay.breaks[breakIndex] = { ...newDay.breaks[breakIndex], [field]: value };
      return { ...prev, [dayIndex]: newDay };
    });
  };

  const addBreak = (dayIndex: number) => {
    setSchedule(prev => ({
      ...prev,
      [dayIndex]: { ...prev[dayIndex], breaks: [...prev[dayIndex].breaks, { start: '12:00', end: '13:00' }] },
    }));
  };

  const removeBreak = (dayIndex: number, breakIndex: number) => {
    setSchedule(prev => ({
      ...prev,
      [dayIndex]: { ...prev[dayIndex], breaks: prev[dayIndex].breaks.filter((_, i) => i !== breakIndex) },
    }));
  };

  const handleSaveChanges = async () => {
    if (!businessId) return toast.error("Business not found.");

    const toCreate: CreateWorkingHourCommand[] = [];
    const toUpdate: { workingHourId: number; data: UpdateWorkingHourCommand }[] = [];
    const toDelete: number[] = [];
    
    const initialHoursMap = new Map(initialWorkingHours?.map(h => [h.id, h]));

    for (const dayIndexStr of Object.keys(schedule)) {
      const dayIndex = parseInt(dayIndexStr, 10);
      const dayData = schedule[dayIndex];
      
      const allSlots = [
        { ...dayData.workSlot, isBreak: false },
        ...dayData.breaks.map(b => ({ ...b, isBreak: true })),
      ];

      const initialIdsForDay = initialWorkingHours?.filter(h => dayNameToIndexMap[h.dayOfWeek as string] === dayIndex).map(h => h.id) || [];

      if (dayData.isActive) {
        allSlots.forEach(slot => {
          const payload = { 
            dayOfWeek: DAYS_CONFIG[dayIndex].name as DayOfWeek, 
            startTime: slot.start, 
            endTime: slot.end, 
            isBreak: slot.isBreak,
            staffId: null
          };
          
          if (slot.id && initialHoursMap.has(slot.id)) {
            toUpdate.push({ workingHourId: slot.id, data: payload as UpdateWorkingHourCommand });
          } else {
            toCreate.push(payload as CreateWorkingHourCommand);
          }
        });
        
        const currentIds = allSlots.map(s => s.id).filter(Boolean);
        initialIdsForDay.forEach(id => {
          if (id && !currentIds.includes(id)) toDelete.push(id);
        });

      } else {
        initialIdsForDay.forEach(id => { if (id) toDelete.push(id) });
      }
    }

    const promises = [
      ...toCreate.map(data => createItem({ businessId, data })),
      ...toUpdate.map(p => updateItem({ businessId, ...p })),
      ...toDelete.map(workingHourId => deleteItem({ businessId, workingHourId })),
    ];
    
    if (promises.length === 0) return toast.info("No changes to save.");
    
    toast.promise(Promise.all(promises), {
      loading: "Değişiklikler kaydediliyor...",
      success: "Çalışma saatleri başarıyla güncellendi!",
      error: "Kaydetme sırasında bir hata oluştu."
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Çalışma saatleri yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Çalışma Saatleri</h1>
          <p className="text-muted-foreground">
            İşletmenizin haftalık çalışma saatlerini düzenleyin
          </p>
        </div>
        <Button onClick={handleSaveChanges} disabled={isSaving} size="lg" className="gap-2">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Değişiklikleri Kaydet
            </>
          )}
        </Button>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Günler</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activeDays}/7</div>
            <p className="text-xs text-muted-foreground mt-1">Haftalık çalışma günü</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Mola</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.totalBreaks}</div>
            <p className="text-xs text-muted-foreground mt-1">Mola sayısı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Saat</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.averageHours.toFixed(1)} saat</div>
            <p className="text-xs text-muted-foreground mt-1">Günlük ortalama</p>
          </CardContent>
        </Card>
      </div>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Çalışma saatleri yüklenemedi: {(fetchError as Error).message}
          </AlertDescription>
        </Alert>
      )}

      {/* Haftalık Program */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Haftalık Program
          </CardTitle>
          <CardDescription>
            Her gün için çalışma saatlerini ve molaları ayarlayın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {DAYS_CONFIG.map((day, index) => {
            const dayData = schedule[index];
            if (!dayData) return null;
            const DayIcon = day.icon;

            return (
              <div key={index} className="space-y-4">
                {/* Gün Başlığı */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${day.color}`}>
                      <DayIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <Label htmlFor={`switch-${index}`} className="text-lg font-semibold cursor-pointer">
                        {day.displayName}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {dayData.isActive 
                          ? `${dayData.workSlot.start} - ${dayData.workSlot.end}` 
                          : 'Kapalı'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={dayData.isActive ? 'default' : 'secondary'}
                      className={dayData.isActive 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                      }
                    >
                      {dayData.isActive ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Açık</>
                      ) : (
                        <><XCircle className="h-3 w-3 mr-1" /> Kapalı</>
                      )}
                    </Badge>
                    <Switch
                      id={`switch-${index}`}
                      checked={dayData.isActive}
                      onCheckedChange={(checked) => handleToggleDay(index, checked)}
                    />
                  </div>
                </div>

                {/* Gün Detayları */}
                {dayData.isActive && (
                  <div className="ml-4 space-y-4 p-4 border-l-2 border-primary/20">
                    {/* Çalışma Saatleri */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="h-4 w-4 text-primary" />
                        Çalışma Saatleri
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Başlangıç</Label>
                          <Input 
                            type="time" 
                            value={dayData.workSlot.start} 
                            onChange={(e) => handleTimeChange(index, 'workSlot', e.target.value, 'start')}
                            className="w-32"
                          />
                        </div>
                        <span className="text-lg text-muted-foreground mt-6">—</span>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Bitiş</Label>
                          <Input 
                            type="time" 
                            value={dayData.workSlot.end}
                            onChange={(e) => handleTimeChange(index, 'workSlot', e.target.value, 'end')}
                            className="w-32"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Molalar */}
                    {dayData.breaks.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Coffee className="h-4 w-4 text-orange-500" />
                          Mola Saatleri
                        </div>
                        <div className="space-y-2">
                          {dayData.breaks.map((breakSlot, breakIndex) => (
                            <div key={breakIndex} className="flex items-center gap-4 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Mola Başlangıcı</Label>
                                <Input 
                                  type="time" 
                                  value={breakSlot.start}
                                  onChange={(e) => handleTimeChange(index, 'break', e.target.value, 'start', breakIndex)}
                                  className="w-32"
                                />
                              </div>
                              <span className="text-lg text-muted-foreground mt-6">—</span>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Mola Bitişi</Label>
                                <Input 
                                  type="time" 
                                  value={breakSlot.end}
                                  onChange={(e) => handleTimeChange(index, 'break', e.target.value, 'end', breakIndex)}
                                  className="w-32"
                                />
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeBreak(index, breakIndex)}
                                className="mt-6 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mola Ekle Butonu */}
                    <Button 
                      variant="outline" 
                      onClick={() => addBreak(index)}
                      className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-950/30"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Mola Ekle
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Mobil için kaydet butonu */}
      <div className="md:hidden">
        <Button 
          onClick={handleSaveChanges} 
          disabled={isSaving} 
          className="w-full gap-2"
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Değişiklikleri Kaydet
            </>
          )}
        </Button>
      </div>
    </div>
  );
}