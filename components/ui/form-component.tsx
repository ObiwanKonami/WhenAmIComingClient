// components/ui/form-components.tsx - Reusable Form Components

import * as React from "react"
import { UseFormReturn, FieldPath, FieldValues } from "react-hook-form"
import { cn } from "@/lib/utils"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Eye, EyeOff, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

// ================================
// FORM WRAPPER COMPONENT
// ================================
interface FormWrapperProps {
  form: UseFormReturn<any>
  onSubmit: (data: any) => void
  children: React.ReactNode
  className?: string
}

export function FormWrapper({ form, onSubmit, children, className }: FormWrapperProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-6", className)}>
        {children}
      </form>
    </Form>
  )
}

// ================================
// FORM FIELD COMPONENTS
// ================================

// Text Input Field
interface FormInputProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  description?: string
  type?: "text" | "email" | "number" | "tel" | "url"
  disabled?: boolean
  className?: string
}

export function FormInput<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  description,
  type = "text",
  disabled = false,
  className,
}: FormInputProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              type={type}
              placeholder={placeholder}
              disabled={disabled}
              value={field.value || ""}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Password Input Field
interface FormPasswordProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  description?: string
  disabled?: boolean
  className?: string
}

export function FormPassword<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  description,
  disabled = false,
  className,
}: FormPasswordProps<T>) {
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                {...field}
                type={showPassword ? "text" : "password"}
                placeholder={placeholder}
                disabled={disabled}
                value={field.value || ""}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={disabled}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Textarea Field
interface FormTextareaProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  description?: string
  rows?: number
  disabled?: boolean
  className?: string
}

export function FormTextarea<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  description,
  rows = 3,
  disabled = false,
  className,
}: FormTextareaProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              placeholder={placeholder}
              rows={rows}
              disabled={disabled}
              value={field.value || ""}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Select Field
interface FormSelectProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  description?: string
  options: { value: string; label: string }[]
  disabled?: boolean
  className?: string
}

export function FormSelect<T extends FieldValues>({
  form,
  name,
  label,
  placeholder = "Seçiniz...",
  description,
  options,
  disabled = false,
  className,
}: FormSelectProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Checkbox Field
interface FormCheckboxProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  description?: string
  disabled?: boolean
  className?: string
}

export function FormCheckbox<T extends FieldValues>({
  form,
  name,
  label,
  description,
  disabled = false,
  className,
}: FormCheckboxProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("flex flex-row items-start space-x-3 space-y-0", className)}>
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>{label}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Date Picker Field
interface FormDatePickerProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  description?: string
  disabled?: boolean
  className?: string
}

export function FormDatePicker<T extends FieldValues>({
  form,
  name,
  label,
  placeholder = "Tarih seçiniz",
  description,
  disabled = false,
  className,
}: FormDatePickerProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                  disabled={disabled}
                >
                  {field.value ? (
                    format(new Date(field.value), "dd MMMM yyyy", { locale: tr })
                  ) : (
                    <span>{placeholder}</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value ? new Date(field.value) : undefined}
                onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                disabled={disabled}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Time Picker Field
interface FormTimePickerProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  description?: string
  disabled?: boolean
  className?: string
}

export function FormTimePicker<T extends FieldValues>({
  form,
  name,
  label,
  placeholder = "00:00",
  description,
  disabled = false,
  className,
}: FormTimePickerProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              type="time"
              placeholder={placeholder}
              disabled={disabled}
              value={field.value || ""}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// ================================
// FORM SECTION COMPONENTS
// ================================

// Form Section
interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="border-b pb-2">
          {title && <h3 className="text-lg font-medium">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="grid gap-4">{children}</div>
    </div>
  )
}

// Form Grid
interface FormGridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4
  className?: string
}

export function FormGrid({ children, cols = 2, className }: FormGridProps) {
  return (
    <div className={cn(
      "grid gap-4",
      {
        "grid-cols-1": cols === 1,
        "grid-cols-1 md:grid-cols-2": cols === 2,
        "grid-cols-1 md:grid-cols-2 lg:grid-cols-3": cols === 3,
        "grid-cols-1 md:grid-cols-2 lg:grid-cols-4": cols === 4,
      },
      className
    )}>
      {children}
    </div>
  )
}

// ================================
// FORM BUTTONS
// ================================

// Submit Button
interface FormSubmitButtonProps {
  isLoading?: boolean
  children: React.ReactNode
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function FormSubmitButton({
  isLoading = false,
  children,
  className,
  variant = "default",
  size = "default",
}: FormSubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
}

// Form Actions (Submit + Cancel buttons)
interface FormActionsProps {
  isLoading?: boolean
  submitText?: string
  cancelText?: string
  onCancel?: () => void
  className?: string
  submitVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function FormActions({
  isLoading = false,
  submitText = "Kaydet",
  cancelText = "İptal",
  onCancel,
  className,
  submitVariant = "default",
}: FormActionsProps) {
  return (
    <div className={cn("flex justify-end space-x-2", className)}>
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancelText}
        </Button>
      )}
      <FormSubmitButton isLoading={isLoading} variant={submitVariant}>
        {submitText}
      </FormSubmitButton>
    </div>
  )
}

// ================================
// SPECIALIZED FORM COMPONENTS
// ================================

// Gender Select
interface FormGenderSelectProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label?: string
  className?: string
  disabled?: boolean
}

export function FormGenderSelect<T extends FieldValues>({
  form,
  name,
  label = "Cinsiyet",
  className,
  disabled = false,
}: FormGenderSelectProps<T>) {
  const genderOptions = [
    { value: "male", label: "Erkek" },
    { value: "female", label: "Kadın" },
    { value: "other", label: "Diğer" },
  ]

  return (
    <FormSelect
      form={form}
      name={name}
      label={label}
      options={genderOptions}
      className={className}
      disabled={disabled}
    />
  )
}

// Status Select
interface FormStatusSelectProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label?: string
  className?: string
  disabled?: boolean
}

export function FormStatusSelect<T extends FieldValues>({
  form,
  name,
  label = "Durum",
  className,
  disabled = false,
}: FormStatusSelectProps<T>) {
  const statusOptions = [
    { value: "true", label: "Aktif" },
    { value: "false", label: "Pasif" },
  ]

  return (
    <FormSelect
      form={form}
      name={name}
      label={label}
      options={statusOptions}
      className={className}
      disabled={disabled}
    />
  )
}

// Currency Input
interface FormCurrencyInputProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  description?: string
  currency?: string
  disabled?: boolean
  className?: string
}

export function FormCurrencyInput<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  description,
  currency = "₺",
  disabled = false,
  className,
}: FormCurrencyInputProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                {...field}
                type="number"
                step="0.01"
                min="0"
                placeholder={placeholder}
                disabled={disabled}
                value={field.value || ""}
                className="pr-12"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {currency}
              </div>
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Rich Text Editor (Simple for now, can be extended with a proper editor)
interface FormRichTextProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  description?: string
  disabled?: boolean
  className?: string
}

export function FormRichText<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  description,
  disabled = false,
  className,
}: FormRichTextProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              placeholder={placeholder}
              rows={8}
              disabled={disabled}
              value={field.value || ""}
              className="min-h-[200px]"
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Phone Input with country code
interface FormPhoneInputProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  description?: string
  disabled?: boolean
  className?: string
}

export function FormPhoneInput<T extends FieldValues>({
  form,
  name,
  label,
  placeholder = "+90 555 123 45 67",
  description,
  disabled = false,
  className,
}: FormPhoneInputProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              type="tel"
              placeholder={placeholder}
              disabled={disabled}
              value={field.value || ""}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// URL Input
interface FormUrlInputProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  description?: string
  disabled?: boolean
  className?: string
}

export function FormUrlInput<T extends FieldValues>({
  form,
  name,
  label,
  placeholder = "https://example.com",
  description,
  disabled = false,
  className,
}: FormUrlInputProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              type="url"
              placeholder={placeholder}
              disabled={disabled}
              value={field.value || ""}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Color Picker
interface FormColorPickerProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  description?: string
  disabled?: boolean
  className?: string
}

export function FormColorPicker<T extends FieldValues>({
  form,
  name,
  label,
  description,
  disabled = false,
  className,
}: FormColorPickerProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="flex items-center space-x-2">
              <Input
                type="color"
                {...field}
                disabled={disabled}
                className="w-16 h-10 border rounded cursor-pointer"
                value={field.value || "#000000"}
              />
              <Input
                {...field}
                placeholder="#000000"
                disabled={disabled}
                value={field.value || ""}
                className="flex-1"
              />
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// File Upload (Simple)
interface FormFileUploadProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  description?: string
  accept?: string
  disabled?: boolean
  className?: string
}

export function FormFileUpload<T extends FieldValues>({
  form,
  name,
  label,
  description,
  accept,
  disabled = false,
  className,
}: FormFileUploadProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field: { value, onChange, ...field } }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              type="file"
              accept={accept}
              disabled={disabled}
              onChange={(e) => onChange(e.target.files?.[0])}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Multi Select (Basic implementation)
interface FormMultiSelectProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  description?: string
  options: { value: string; label: string }[]
  disabled?: boolean
  className?: string
}

export function FormMultiSelect<T extends FieldValues>({
  form,
  name,
  label,
  placeholder = "Seçiniz...",
  description,
  options,
  disabled = false,
  className,
}: FormMultiSelectProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <select
              {...field}
              multiple
              disabled={disabled}
              className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={field.value || []}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value)
                field.onChange(values)
              }}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Number Input with increment/decrement
interface FormNumberInputProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  description?: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
}

export function FormNumberInput<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  description,
  min,
  max,
  step = 1,
  disabled = false,
  className,
}: FormNumberInputProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              type="number"
              placeholder={placeholder}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              value={field.value || ""}
              onChange={(e) => {
                const value = e.target.value
                field.onChange(value === "" ? "" : Number(value))
              }}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Switch Toggle
interface FormSwitchProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  description?: string
  disabled?: boolean
  className?: string
}

export function FormSwitch<T extends FieldValues>({
  form,
  name,
  label,
  description,
  disabled = false,
  className,
}: FormSwitchProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("flex flex-row items-center justify-between rounded-lg border p-4", className)}>
          <div className="space-y-0.5">
            <FormLabel className="text-base">{label}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

// ================================
// COMPOSITE FORM COMPONENTS
// ================================

// Address Form Group
interface FormAddressGroupProps<T extends FieldValues> {
  form: UseFormReturn<T>
  addressField: FieldPath<T>
  cityField?: FieldPath<T>
  stateField?: FieldPath<T>
  zipField?: FieldPath<T>
  countryField?: FieldPath<T>
  className?: string
}

export function FormAddressGroup<T extends FieldValues>({
  form,
  addressField,
  cityField,
  stateField,
  zipField,
  countryField,
  className,
}: FormAddressGroupProps<T>) {
  return (
    <FormSection title="Adres Bilgileri" className={className}>
      <FormTextarea
        form={form}
        name={addressField}
        label="Adres"
        placeholder="Tam adres giriniz..."
        rows={3}
      />
      
      <FormGrid cols={2}>
        {cityField && (
          <FormInput
            form={form}
            name={cityField}
            label="Şehir"
            placeholder="Şehir"
          />
        )}
        
        {stateField && (
          <FormInput
            form={form}
            name={stateField}
            label="İlçe"
            placeholder="İlçe"
          />
        )}
      </FormGrid>
      
      <FormGrid cols={2}>
        {zipField && (
          <FormInput
            form={form}
            name={zipField}
            label="Posta Kodu"
            placeholder="34000"
          />
        )}
        
        {countryField && (
          <FormInput
            form={form}
            name={countryField}
            label="Ülke"
            placeholder="Türkiye"
          />
        )}
      </FormGrid>
    </FormSection>
  )
}

// Contact Form Group
interface FormContactGroupProps<T extends FieldValues> {
  form: UseFormReturn<T>
  emailField: FieldPath<T>
  phoneField: FieldPath<T>
  websiteField?: FieldPath<T>
  className?: string
}

export function FormContactGroup<T extends FieldValues>({
  form,
  emailField,
  phoneField,
  websiteField,
  className,
}: FormContactGroupProps<T>) {
  return (
    <FormSection title="İletişim Bilgileri" className={className}>
      <FormGrid cols={2}>
        <FormInput
          form={form}
          name={emailField}
          label="E-posta"
          type="email"
          placeholder="ornek@email.com"
        />
        
        <FormPhoneInput
          form={form}
          name={phoneField}
          label="Telefon"
        />
      </FormGrid>
      
      {websiteField && (
        <FormUrlInput
          form={form}
          name={websiteField}
          label="Website"
          placeholder="https://www.example.com"
        />
      )}
    </FormSection>
  )
}

// Date Range Form Group
interface FormDateRangeGroupProps<T extends FieldValues> {
  form: UseFormReturn<T>
  startDateField: FieldPath<T>
  endDateField: FieldPath<T>
  startLabel?: string
  endLabel?: string
  className?: string
}

export function FormDateRangeGroup<T extends FieldValues>({
  form,
  startDateField,
  endDateField,
  startLabel = "Başlangıç Tarihi",
  endLabel = "Bitiş Tarihi",
  className,
}: FormDateRangeGroupProps<T>) {
  return (
    <FormGrid cols={2} className={className}>
      <FormDatePicker
        form={form}
        name={startDateField}
        label={startLabel}
      />
      
      <FormDatePicker
        form={form}
        name={endDateField}
        label={endLabel}
      />
    </FormGrid>
  )
}

// Time Range Form Group
interface FormTimeRangeGroupProps<T extends FieldValues> {
  form: UseFormReturn<T>
  startTimeField: FieldPath<T>
  endTimeField: FieldPath<T>
  startLabel?: string
  endLabel?: string
  className?: string
}

export function FormTimeRangeGroup<T extends FieldValues>({
  form,
  startTimeField,
  endTimeField,
  startLabel = "Başlangıç Saati",
  endLabel = "Bitiş Saati",
  className,
}: FormTimeRangeGroupProps<T>) {
  return (
    <FormGrid cols={2} className={className}>
      <FormTimePicker
        form={form}
        name={startTimeField}
        label={startLabel}
      />
      
      <FormTimePicker
        form={form}
        name={endTimeField}
        label={endLabel}
      />
    </FormGrid>
  )
}

// ================================
// FORM LOADING STATES
// ================================
export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <div className="h-10 bg-gray-200 rounded w-20"></div>
        <div className="h-10 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  )
}
