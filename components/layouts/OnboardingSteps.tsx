'use client'

import { useState } from 'react'
import { 
  CheckCircle2, 
  X, 
  Clock, 
  Users, 
  UserPlus, 
  Briefcase,
  ChevronRight,
  Sparkles,
  Target
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// Component'in alacağı propların tip tanımı
type OnboardingStatus = {
  hasSetWorkingHours: boolean;
  hasAddedStaff: boolean;
  hasAddedCustomer: boolean;
  hasAddedService: boolean;
};

type Props = {
  status: OnboardingStatus;
};

// Adımları bir array olarak tanımlamak, kodu daha temiz ve yönetilebilir yapar.
const onboardingSteps = [
  {
    id: 'hours',
    label: 'Set Business Hours',
    description: 'Define when your business is available',
    link: '/user/settings/working-hours',
    icon: Clock,
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-50 dark:hover:bg-blue-950/30',
    isCompleted: (status: OnboardingStatus) => status.hasSetWorkingHours,
  },
  {
    id: 'staff',
    label: 'Add Staff',
    description: 'Add team members to your business',
    link: '/user/settings/staffs',
    icon: Users,
    color: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-50 dark:hover:bg-purple-950/30',
    isCompleted: (status: OnboardingStatus) => status.hasAddedStaff,
  },
  {
    id: 'customer',
    label: 'Add Customer',
    description: 'Add your first customer',
    link: '/user/settings/customers',
    icon: UserPlus,
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-50 dark:hover:bg-green-950/30',
    isCompleted: (status: OnboardingStatus) => status.hasAddedCustomer,
  },
  {
    id: 'service',
    label: 'Add Service',
    description: 'Create services for your business',
    link: '/user/settings/services',
    icon: Briefcase,
    color: 'bg-orange-500',
    hoverColor: 'hover:bg-orange-50 dark:hover:bg-orange-950/30',
    isCompleted: (status: OnboardingStatus) => status.hasAddedService,
  },
];

export function OnboardingSteps({ status }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Tüm adımlar tamamlandı mı?
  const allStepsCompleted = onboardingSteps.every(step => step.isCompleted(status));
  const completedStepsCount = onboardingSteps.filter(step => step.isCompleted(status)).length;
  const totalSteps = onboardingSteps.length;
  const progress = (completedStepsCount / totalSteps) * 100;

  // Eğer tüm adımlar tamsa veya kullanıcı kutuyu kapattıysa, component'i hiç render etme.
  if (allStepsCompleted || !isOpen) {
    return null;
  }

  return (
    <div className="fixed top-24 right-6 z-50 w-80 rounded-xl bg-white shadow-2xl border-0 dark:bg-slate-900 overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h3 className="font-semibold">Welcome Setup</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label={isMinimized ? "Expand" : "Minimize"}
            >
              <Target className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">{completedStepsCount}/{totalSteps} completed</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      {!isMinimized && (
        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            Complete these steps to get your business ready:
          </p>
          
          <div className="space-y-2">
            {onboardingSteps.map((step, index) => {
              const completed = step.isCompleted(status);
              const StepIcon = step.icon;
              
              return (
                <Link 
                  key={step.id} 
                  href={step.link} 
                  className={cn(
                    "group block p-3 rounded-lg border transition-all duration-200",
                    completed 
                      ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" 
                      : "bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700",
                    !completed && step.hoverColor,
                    "hover:shadow-md hover:scale-[1.02]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200",
                      completed 
                        ? "bg-green-500 text-white" 
                        : `${step.color} text-white group-hover:scale-110`
                    )}>
                      {completed ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={cn(
                          "font-medium text-sm",
                          completed 
                            ? "text-green-700 dark:text-green-400 line-through" 
                            : "text-gray-900 dark:text-gray-100"
                        )}>
                          {step.label}
                        </h4>
                        {completed && (
                          <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                            Done
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs mt-0.5",
                        completed 
                          ? "text-green-600 dark:text-green-500" 
                          : "text-gray-500 dark:text-gray-400"
                      )}>
                        {step.description}
                      </p>
                    </div>
                    
                    {/* Arrow */}
                    {!completed && (
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Footer Message */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-400 text-center">
              {completedStepsCount === 0 
                ? "Let's get started! Complete these steps to set up your business." 
                : `Great progress! ${totalSteps - completedStepsCount} more step${totalSteps - completedStepsCount === 1 ? '' : 's'} to go.`
              }
            </p>
          </div>
        </div>
      )}

      {/* Minimized State */}
      {isMinimized && (
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">{completedStepsCount}/{totalSteps} completed</span>
            </div>
            <button
              onClick={() => setIsMinimized(false)}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Show Steps
            </button>
          </div>
        </div>
      )}
    </div>
  );
}