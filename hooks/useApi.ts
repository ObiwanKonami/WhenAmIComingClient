import { useQueryClient, QueryKey, useQuery } from '@tanstack/react-query';

// =================================================================
// ÜRETİLEN TÜM HOOK MODÜLLERİNİ IMPORT ET
// =================================================================
import * as authApi from './generated/auth/auth';
import * as usersApi from './generated/users/users';
import * as businessApi from './generated/business/business';
import * as servicesApi from './generated/services/services';
import * as staffApi from './generated/staff/staff';
import * as customersApi from './generated/customers/customers';
import * as appointmentsApi from './generated/appointments/appointments';
import * as workingHoursApi from './generated/working-hours/working-hours';
import * as locationsApi from './generated/locations/locations';
import * as serviceExtrasApi from './generated/service-extras/service-extras';
import * as galleriesApi from './generated/galleries/galleries';
import * as slidersApi from './generated/sliders/sliders';
import * as brandsApi from './generated/brands/brands';
import * as portfoliosApi from './generated/portfolios/portfolios';
import * as eventsApi from './generated/events/events';
import * as eventBookingsApi from './generated/event-bookings/event-bookings';
import * as pagesApi from './generated/pages/pages';
import * as testimonialsApi from './generated/testimonials/testimonials';
import * as faqsApi from './generated/faqs/faqs';
import * as blogCategoriesApi from './generated/blog-categories/blog-categories';
import * as blogPostsApi from './generated/blog-posts/blog-posts';
import * as plansApi from './generated/plans/plans';
import * as couponsApi from './generated/coupons/coupons';
import * as subscriptionsApi from './generated/subscriptions/subscriptions';
import * as payoutsApi from './generated/payouts/payouts';
import * as referralsApi from './generated/referrals/referrals';
import * as ratingsApi from './generated/ratings/ratings';
import * as contactMessagesApi from './generated/contact-messages/contact-messages';
import * as featuresApi from './generated/features/features';
import * as serviceCategoryApi from './generated/service-category/service-category';
import * as uploadApi from './generated/upload/upload';
import * as publicProfileApi from './generated/public-profile/public-profile'
import * as systemSettingsApi from './generated/system-settings/system-settings';
import * as rolesApi from './generated/roles/roles';
import * as transactionsApi from './generated/transactions/transactions';
import * as reportsApi from './generated/reports/reports';



// GEREKLİ TİPLERİ IMPORT ET
import type { CreateCouponCommand, UserDto } from '@/lib/api/generated/model';
import type { SystemSettingDto } from '@/lib/api/generated/model';
import type { AvailabilitySlotDto } from '@/lib/api/generated/model'; 
import type { TransactionDto } from '@/lib/api/generated/model';

// =================================================================
// YARDIMCI FONKSİYON VE AUTH HOOKS
// =================================================================

const useApiOperations = (invalidateQueryKey: (...args: any[]) => QueryKey) => {
  const queryClient = useQueryClient();
  return (...args: any[]) => ({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: invalidateQueryKey(...args) });
      },
    },
  });
};

export function useAuth(options?: { 
  onLoginSuccess?: (data: any) => void; 
  onRegisterSuccess?: (data: any) => void; 
}) {
  const queryClient = useQueryClient();
  
  const { 
    mutateAsync: login, 
    isPending: isLoggingIn, 
    error: loginError, // login için error'u al
    ...loginRest 
  } = authApi.usePostApiAuthLogin({
    mutation: { 
      onSuccess: (data) => { 
        queryClient.setQueryData(authApi.getGetApiAuthVerifySessionQueryKey(), data); 
        options?.onLoginSuccess?.(data); 
      } 
    },
  });

  const { 
    mutateAsync: register, 
    isPending: isRegistering, 
    error: registerError, // DÜZELTME: register için de error'u al
    ...registerRest 
  } = authApi.usePostApiAuthRegister({
    mutation: { 
      onSuccess: (data) => { 
        queryClient.setQueryData(authApi.getGetApiAuthVerifySessionQueryKey(), data); 
        options?.onRegisterSuccess?.(data); 
      } 
    },
  });
  
  const { 
    mutateAsync: logout, 
    isPending: isLoggingOut, 
    ...logoutRest 
  } = authApi.usePostApiAuthLogout({
    mutation: { onSuccess: () => queryClient.clear(), onError: () => queryClient.clear() },
  });

  // DÜZELTME: `registerError`'ı da return objesine ekliyoruz.
  return { 
    login, isLoggingIn, loginError, ...loginRest,
    register, isRegistering, registerError, ...registerRest,
    logout, isLoggingOut, ...logoutRest
  };
}

export function useCurrentUser() {
  return authApi.useGetApiAuthVerifySession<UserDto>({
    query: {
      queryKey: authApi.getGetApiAuthVerifySessionQueryKey(),
      retry: 1,
      refetchOnWindowFocus: false,
    },
  });
}

// =================================================================
// TÜM VARLIKLAR İÇİN STANDARTLAŞTIRILMIŞ HOOK'LAR
// =================================================================

// --- USERS ---
export const useUsers = usersApi.useGetApiUsers;
export function useUserOperations() {
  const mutationOptions = useApiOperations(usersApi.getGetApiUsersQueryKey)();
  const { mutateAsync: createItem, isPending: isCreating } = usersApi.usePostApiUsers(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = usersApi.usePutApiUsersId(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = usersApi.useDeleteApiUsersId(mutationOptions);
  return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting };
}

export function useUserAdminUpdate() {
  const queryClient = useQueryClient(); // QueryClient'ı alıyoruz

  const { mutateAsync: adminUpdate, isPending: isSaving } =
    usersApi.usePutApiUsersIdAdmin({
      mutation: {
        // İşlem başarılı olduğunda bu fonksiyon çalışır
        onSuccess: () => {
          // Hem kullanıcılar hem de abonelikler listesini yenilenmesi için
          // önbelleklerini geçersiz kılıyoruz.
          console.log('Invalidating users and subscriptions queries...');
          queryClient.invalidateQueries({ queryKey: usersApi.getGetApiUsersQueryKey() });
          queryClient.invalidateQueries({ queryKey: subscriptionsApi.getGetApiSubscriptionsQueryKey() });
        },
      },
    });
  // opsiyonel: başka query’leri de tazele
  const qc = useQueryClient();
  const invalidateExtra = async () => {
    try {
      const key = subscriptionsApi.getGetApiSubscriptionsQueryKey?.();
      if (key) await qc.invalidateQueries({ queryKey: key });
    } catch {}
  };

  return { adminUpdate, isSaving, invalidateExtra };
}

// --- BUSINESS ---
export const useBusiness = businessApi.useGetApiBusiness;
export function useBusinessOperations() {
  const mutationOptions = useApiOperations(businessApi.getGetApiBusinessQueryKey)();
  const { mutateAsync: createItem, isPending: isCreating } = businessApi.usePostApiBusiness(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = businessApi.usePutApiBusinessId(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = businessApi.useDeleteApiBusinessId(mutationOptions);
  return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting };
}
export const useBusinessSlugCheck = businessApi.useGetApiBusinessCheckSlugSlug;

// --- SERVICES ---
export const useServices = servicesApi.useGetApiBusinessBusinessIdServices;
export function useServiceOperations(businessId: number) {
  const mutationOptions = useApiOperations(servicesApi.getGetApiBusinessBusinessIdServicesQueryKey)(businessId);
  const { mutateAsync: createItem, isPending: isCreating } = servicesApi.usePostApiBusinessBusinessIdServices(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = servicesApi.usePutApiBusinessBusinessIdServicesServiceId(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = servicesApi.useDeleteApiBusinessBusinessIdServicesServiceId(mutationOptions);
  return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting };
}

// --- STAFF ---
export const useStaff = staffApi.useGetApiBusinessBusinessIdStaff;
export function useStaffOperations(businessId: number) {
  const mutationOptions = useApiOperations(staffApi.getGetApiBusinessBusinessIdStaffQueryKey)(businessId);
  const { mutateAsync: createItem, isPending: isCreating } = staffApi.usePostApiBusinessBusinessIdStaff(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = staffApi.usePutApiBusinessBusinessIdStaffStaffId(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = staffApi.useDeleteApiBusinessBusinessIdStaffStaffId(mutationOptions);
  const { mutateAsync: assignServices, isPending: isAssigning } = staffApi.usePostApiBusinessBusinessIdStaffStaffIdAssignServices();
  return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting, assignServices, isAssigning };
}

// --- CUSTOMERS ---
export const useCustomers = customersApi.useGetApiBusinessBusinessIdCustomers;
export function useCustomerOperations(businessId: number) {
  const mutationOptions = useApiOperations(customersApi.getGetApiBusinessBusinessIdCustomersQueryKey)(businessId);
  const { mutateAsync: createItem, isPending: isCreating } = customersApi.usePostApiBusinessBusinessIdCustomers(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = customersApi.usePutApiBusinessBusinessIdCustomersCustomerId(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = customersApi.useDeleteApiBusinessBusinessIdCustomersCustomerId(mutationOptions);
  return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting };
}

// --- APPOINTMENTS ---
export const useAppointments = appointmentsApi.useGetApiBusinessBusinessIdAppointments;
export function useAppointmentOperations(businessId: number) {
  const mutationOptions = useApiOperations(appointmentsApi.getGetApiBusinessBusinessIdAppointmentsQueryKey)(businessId);
  const { mutateAsync: createItem, isPending: isCreating } = appointmentsApi.usePostApiBusinessBusinessIdAppointments(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = appointmentsApi.usePutApiBusinessBusinessIdAppointmentsAppointmentId(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = appointmentsApi.useDeleteApiBusinessBusinessIdAppointmentsAppointmentId(mutationOptions);
  return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting };
}

// --- WORKING HOURS ---
export const useWorkingHours = workingHoursApi.useGetApiBusinessBusinessIdWorkinghours;
export function useWorkingHourOperations(businessId: number) {
  const mutationOptions = useApiOperations(workingHoursApi.getGetApiBusinessBusinessIdWorkinghoursQueryKey)(businessId);
  const { mutateAsync: createItem, isPending: isCreating } = workingHoursApi.usePostApiBusinessBusinessIdWorkinghours(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = workingHoursApi.usePutApiBusinessBusinessIdWorkinghoursWorkingHourId(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = workingHoursApi.useDeleteApiBusinessBusinessIdWorkinghoursWorkingHourId(mutationOptions);
  return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting };
}

// --- LOCATIONS ---
export const useLocations = locationsApi.useGetApiBusinessBusinessIdLocations;
export function useLocationOperations(businessId: number) {
  const mutationOptions = useApiOperations(locationsApi.getGetApiBusinessBusinessIdLocationsQueryKey)(businessId);
  const { mutateAsync: createItem, isPending: isCreating } = locationsApi.usePostApiBusinessBusinessIdLocations(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = locationsApi.usePutApiBusinessBusinessIdLocationsLocationId(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = locationsApi.useDeleteApiBusinessBusinessIdLocationsLocationId(mutationOptions);
  return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting };
}

// --- SERVICE EXTRAS ---
export const useServiceExtras = serviceExtrasApi.useGetApiBusinessBusinessIdServicesServiceIdExtras;
export function useServiceExtraOperations(businessId: number, serviceId: number) {
  const mutationOptions = useApiOperations(serviceExtrasApi.getGetApiBusinessBusinessIdServicesServiceIdExtrasQueryKey)(businessId, serviceId);
  const { mutateAsync: createItem, isPending: isCreating } = serviceExtrasApi.usePostApiBusinessBusinessIdServicesServiceIdExtras(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = serviceExtrasApi.usePutApiBusinessBusinessIdServicesServiceIdExtrasServiceExtraId(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = serviceExtrasApi.useDeleteApiBusinessBusinessIdServicesServiceIdExtrasServiceExtraId(mutationOptions);
  return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting };
}

// --- GALLERIES ---
export const useGalleries = galleriesApi.useGetApiBusinessBusinessIdGalleries;
export function useGalleryOperations(businessId: number) {
  const mutationOptions = useApiOperations(galleriesApi.getGetApiBusinessBusinessIdGalleriesQueryKey)(businessId);
  const { mutateAsync: createItem, isPending: isCreating } = galleriesApi.usePostApiBusinessBusinessIdGalleries(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = galleriesApi.usePutApiBusinessBusinessIdGalleriesGalleryItemId(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = galleriesApi.useDeleteApiBusinessBusinessIdGalleriesGalleryItemId(mutationOptions);
  return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting };
}

// --- SLIDERS ---
export const useSliders = slidersApi.useGetApiBusinessBusinessIdSliders;
export function useSliderOperations(businessId: number) {
  const mutationOptions = useApiOperations(slidersApi.getGetApiBusinessBusinessIdSlidersQueryKey)(businessId);
  const { mutateAsync: createItem, isPending: isCreating } = slidersApi.usePostApiBusinessBusinessIdSliders(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = slidersApi.usePutApiBusinessBusinessIdSlidersSliderId(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = slidersApi.useDeleteApiBusinessBusinessIdSlidersSliderId(mutationOptions);
  return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting };
}

// --- BRANDS ---
export const useBrands = brandsApi.useGetApiBusinessBusinessIdBrands;
export function useBrandOperations(businessId: number) {
  const mutationOptions = useApiOperations(brandsApi.getGetApiBusinessBusinessIdBrandsQueryKey)(businessId);
  const { mutateAsync: createItem, isPending: isCreating } = brandsApi.usePostApiBusinessBusinessIdBrands(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = brandsApi.usePutApiBusinessBusinessIdBrandsBrandId(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = brandsApi.useDeleteApiBusinessBusinessIdBrandsBrandId(mutationOptions);
  return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting };
}

// --- PORTFOLIOS ---
export const usePortfolios = portfoliosApi.useGetApiBusinessBusinessIdPortfolios;
export function usePortfolioOperations(businessId: number) {
  const mutationOptions = useApiOperations(portfoliosApi.getGetApiBusinessBusinessIdPortfoliosQueryKey)(businessId);
  const { mutateAsync: createItem, isPending: isCreating } = portfoliosApi.usePostApiBusinessBusinessIdPortfolios(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = portfoliosApi.usePutApiBusinessBusinessIdPortfoliosPortfolioId(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = portfoliosApi.useDeleteApiBusinessBusinessIdPortfoliosPortfolioId(mutationOptions);
  return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting };
}

// --- EVENTS ---
export const useEvents = eventsApi.useGetApiBusinessBusinessIdEvents;
export function useEventOperations(businessId: number) {
  const mutationOptions = useApiOperations(eventsApi.getGetApiBusinessBusinessIdEventsQueryKey)(businessId);
  const { mutateAsync: createItem, isPending: isCreating } = eventsApi.usePostApiBusinessBusinessIdEvents(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = eventsApi.usePutApiBusinessBusinessIdEventsEventId(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = eventsApi.useDeleteApiBusinessBusinessIdEventsEventId(mutationOptions);
  // Event Ticket operations
  const { mutateAsync: createEventTicket, isPending: isCreatingTicket } = eventsApi.usePostApiBusinessBusinessIdEventsEventIdTickets(mutationOptions);
  const { mutateAsync: updateEventTicket, isPending: isUpdatingTicket } = eventsApi.usePutApiBusinessBusinessIdEventsEventIdTicketsTicketId(mutationOptions);
  const { mutateAsync: deleteEventTicket, isPending: isDeletingTicket } = eventsApi.useDeleteApiBusinessBusinessIdEventsEventIdTicketsTicketId(mutationOptions);
  return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting, createEventTicket, isCreatingTicket, updateEventTicket, isUpdatingTicket, deleteEventTicket, isDeletingTicket };
}

// --- EVENT BOOKINGS ---
export const useEventBookings = eventBookingsApi.useGetApiBusinessBusinessIdEventsEventIdBookings;
export function useEventBookingOperations(businessId: number, eventId: number) {
  const mutationOptions = useApiOperations(eventBookingsApi.getGetApiBusinessBusinessIdEventsEventIdBookingsQueryKey)(businessId, eventId);
  const { mutateAsync: createItem, isPending: isCreating } = eventBookingsApi.usePostApiBusinessBusinessIdEventsEventIdBookings(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = eventBookingsApi.useDeleteApiBusinessBusinessIdEventsEventIdBookingsBookingId(mutationOptions);
  return { createItem, isCreating, deleteItem, isDeleting };
}

// --- PAGES ---
export const usePages = pagesApi.useGetApiPages;
export function usePageOperations() {
  const mutationOptions = useApiOperations(pagesApi.getGetApiPagesQueryKey)();
  const { mutateAsync: createItem, isPending: isCreating } = pagesApi.usePostApiPages(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = pagesApi.usePutApiPagesPageId(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = pagesApi.useDeleteApiPagesPageId(mutationOptions);
  return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting };
}

// --- TESTIMONIALS ---
export const useTestimonials = testimonialsApi.useGetApiTestimonials;
export function useTestimonialOperations() {
  const mutationOptions = useApiOperations(testimonialsApi.getGetApiTestimonialsQueryKey)();
  const { mutateAsync: createItem, isPending: isCreating } = testimonialsApi.usePostApiTestimonials(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = testimonialsApi.usePutApiTestimonialsTestimonialId(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = testimonialsApi.useDeleteApiTestimonialsTestimonialId(mutationOptions);
  return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting };
}

// --- FAQS ---
export const useFaqs = faqsApi.useGetApiFaqs;
export function useFaqOperations() {
  const mutationOptions = useApiOperations(faqsApi.getGetApiFaqsQueryKey)();
  const { mutateAsync: createItem, isPending: isCreating } = faqsApi.usePostApiFaqs(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = faqsApi.usePutApiFaqsFaqId(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = faqsApi.useDeleteApiFaqsFaqId(mutationOptions);
  return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting };
}

// --- BLOG CATEGORIES ---
export const useBlogCategories = blogCategoriesApi.useGetApiBlogCategories;
export function useBlogCategoryOperations() {
  const mutationOptions = useApiOperations(blogCategoriesApi.getGetApiBlogCategoriesQueryKey)();
  const { mutateAsync: createItem, isPending: isCreating } = blogCategoriesApi.usePostApiBlogCategories(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = blogCategoriesApi.usePutApiBlogCategoriesCategoryId(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = blogCategoriesApi.useDeleteApiBlogCategoriesCategoryId(mutationOptions);
  return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting };
}

// --- BLOG POSTS ---
export const useBlogPosts = blogPostsApi.useGetApiBlogPosts;
export function useBlogPostOperations() {
  const mutationOptions = useApiOperations(blogPostsApi.getGetApiBlogPostsQueryKey)();
  const { mutateAsync: createItem, isPending: isCreating } = blogPostsApi.usePostApiBlogPosts(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = blogPostsApi.usePutApiBlogPostsPostId(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = blogPostsApi.useDeleteApiBlogPostsPostId(mutationOptions);
  return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting };
}

// --- PLANS ---
export const usePlans = plansApi.useGetApiPlans;
export const usePlanForUpdate = plansApi.useGetApiPlansIdForUpdate;
export function usePlanOperations() {
  const mutationOptions = useApiOperations(plansApi.getGetApiPlansQueryKey)();
  const { mutateAsync: createItem, isPending: isCreating } = plansApi.usePostApiPlans(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = plansApi.usePutApiPlansPlanId(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = plansApi.useDeleteApiPlansPlanId(mutationOptions);
  return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting };
}

// --- COUPONS ---
export function useCoupons(opts?: { enabled?: boolean }) {
  return couponsApi.useGetApiCoupons({
    query: {
      enabled: opts?.enabled ?? true,
    },
  })
}

export function useCouponOperations() {
  const mutationOptions = useApiOperations(couponsApi.getGetApiCouponsQueryKey)()

  const { mutateAsync: _createItem, isPending: isCreating } =
    couponsApi.usePostApiCoupons(mutationOptions)

  const { mutateAsync: updateItem, isPending: isUpdating } =
    couponsApi.usePutApiCouponsCouponId(mutationOptions)

  const { mutateAsync: deleteItem, isPending: isDeleting } =
    couponsApi.useDeleteApiCouponsCouponId(mutationOptions)

  const createItem = (payload: CreateCouponCommand) => _createItem({ data: payload })

  return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting }
}

// --- SUBSCRIPTIONS ---
export const useSubscriptions = subscriptionsApi.useGetApiSubscriptions;
export function useSubscriptionOperations() {
  const mutationOptions = useApiOperations(subscriptionsApi.getGetApiSubscriptionsQueryKey)();
  const { mutateAsync: createItem, isPending: isCreating } = subscriptionsApi.usePostApiSubscriptions(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = subscriptionsApi.usePutApiSubscriptionsSubscriptionId(mutationOptions);
  return { createItem, isCreating, updateItem, isUpdating };
}

// --- PAYOUTS ---
export const usePayouts = payoutsApi.useGetApiPayouts;
export function usePayoutOperations() {
  const mutationOptions = useApiOperations(payoutsApi.getGetApiPayoutsQueryKey)();
  const { mutateAsync: requestPayout, isPending: isRequesting } = payoutsApi.usePostApiPayoutsRequest(mutationOptions);
  const { mutateAsync: updatePayoutStatus, isPending: isUpdating } = payoutsApi.usePutApiPayoutsPayoutIdStatus(mutationOptions);
  return { requestPayout, isRequesting, updatePayoutStatus, isUpdating };
}

// --- REFERRALS ---
export const useReferrals = referralsApi.useGetApiReferrals;
export function useReferralOperations() {
  const mutationOptions = useApiOperations(referralsApi.getGetApiReferralsQueryKey)();
  const { mutateAsync: createItem, isPending: isCreating } = referralsApi.usePostApiReferrals(mutationOptions);
  return { createItem, isCreating };
}

// --- RATINGS ---
export const useRatings = ratingsApi.useGetApiRatings;
export function useRatingOperations() {
  const mutationOptions = useApiOperations(ratingsApi.getGetApiRatingsQueryKey)();
  const { mutateAsync: createItem, isPending: isCreating } = ratingsApi.usePostApiRatings(mutationOptions);
  const { mutateAsync: approveItem, isPending: isApproving } = ratingsApi.usePutApiRatingsRatingIdApprove(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = ratingsApi.useDeleteApiRatingsRatingId(mutationOptions);
  return { createItem, isCreating, approveItem, isApproving, deleteItem, isDeleting };
}

// --- CONTACT MESSAGES ---
export const useContactMessages = contactMessagesApi.useGetApiContactMessages;
export function useContactMessageOperations() {
  const mutationOptions = useApiOperations(contactMessagesApi.getGetApiContactMessagesQueryKey)();
  const { mutateAsync: createItem, isPending: isCreating } = contactMessagesApi.usePostApiContactMessages(mutationOptions);
  const { mutateAsync: markAsRead, isPending: isUpdating } = contactMessagesApi.usePutApiContactMessagesMessageIdRead(mutationOptions);
  const { mutateAsync: deleteItem, isPending: isDeleting } = contactMessagesApi.useDeleteApiContactMessagesMessageId(mutationOptions);
  return { createItem, isCreating, markAsRead, isUpdating, deleteItem, isDeleting };
}

// --- FEATURES ---
export const useFeatures = featuresApi.useGetApiFeatures;
export function useFeatureOperations() {
  const mutationOptions = useApiOperations(featuresApi.getGetApiFeaturesQueryKey)();
  const { mutateAsync: createItem, isPending: isCreating } = featuresApi.usePostApiFeatures(mutationOptions);
  const { mutateAsync: updateItem, isPending: isUpdating } = featuresApi.usePutApiFeaturesFeatureId(mutationOptions);
  const { mutateAsync: assignToPlan, isPending: isAssigning } = featuresApi.usePostApiFeaturesAssignToPlan(mutationOptions);
  return { createItem, isCreating, updateItem, isUpdating, assignToPlan, isAssigning };
}

// --- SERVICE CATEGORIES ---
export const useServiceCategories = serviceCategoryApi.useGetApiServiceCategory;
export function useServiceCategoryOperations() {
    const mutationOptions = useApiOperations(serviceCategoryApi.getGetApiServiceCategoryQueryKey)();
    const { mutateAsync: createItem, isPending: isCreating } = serviceCategoryApi.usePostApiServiceCategory(mutationOptions);
    const { mutateAsync: updateItem, isPending: isUpdating } = serviceCategoryApi.usePutApiServiceCategoryId(mutationOptions);
    const { mutateAsync: deleteItem, isPending: isDeleting } = serviceCategoryApi.useDeleteApiServiceCategoryId(mutationOptions);
    return { createItem, isCreating, updateItem, isUpdating, deleteItem, isDeleting };
}

// --- SYSTEM SETTINGS ---
export const useSystemSettings = () => systemSettingsApi.useGetApiSystemSettings<SystemSettingDto[]>();
export function useSystemSettingOperations() {
  const mutationOptions = useApiOperations(systemSettingsApi.getGetApiSystemSettingsQueryKey)();
  const { mutateAsync: updateItem, isPending: isUpdating } = systemSettingsApi.usePutApiSystemSettings(mutationOptions);
  return { updateItem, isUpdating };
}

// --- UPLOAD ---
export const useUploadOperations = uploadApi.usePostApiUploadImage;

// --- PUBLIC PROFILE ---

export const useCompanyPublicProfile = publicProfileApi.useGetApiPublicProfileBusinessSlug;


// --- ROLES ---
export const useRoles = rolesApi.useGetApiRoles
export const usePermissions = rolesApi.useGetApiRolesPermissions

export function useRoleAssignments() {
  const { mutateAsync: assignUserToRole, isPending: isAssigningRole } = rolesApi.usePostApiRolesAssignUser()
  const { mutateAsync: removeUserFromRole, isPending: isRemovingRole } = rolesApi.usePostApiRolesRemoveUser()
  return { assignUserToRole, isAssigningRole, removeUserFromRole, isRemovingRole }
}


// --- AVAILABILITY ---

/**
 * 
 * @param params 
 * @param options 
 */

export function useAvailability(
  businessId: number,
  params: { staffId: number; date: string; serviceDurationInMinutes: number },
  options?: any // 
) {
  const enabled = !!(businessId && params.staffId && params.date && params.serviceDurationInMinutes > 0);

  return appointmentsApi.useGetApiBusinessBusinessIdAppointmentsAvailability<AvailabilitySlotDto[]>(
    businessId,
    {
      staffId: params.staffId,
      date: params.date,
      serviceDurationInMinutes: params.serviceDurationInMinutes
    },
    { 
      query: { 
        ...options, 
        enabled: enabled && (options?.enabled ?? true), 
      },
    }
  );
}

// --- TRANSACTIONS --- 

export const useTransactions = () => transactionsApi.useGetApiTransactions<TransactionDto[]>();


// --- REPORTS --- 

export function useAdminReport() {
  return reportsApi.useGetApiReportsAdmin()
}