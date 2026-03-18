import * as React from 'react';
import { Bell, Zap, Clock, CheckCircle2, Calendar, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Schedule interface
interface Schedule {
  id: string;
  user_id: string;
  type: 'reminder' | 'action';
  content: string;
  cron_expression: string;
  recurring: boolean;
  status: 'active' | 'paused' | 'completed' | 'failed';
  next_execution: string;
  next_execution_local?: string;
  last_execution: string | null;
  last_execution_local?: string | null;
  execution_count: number;
  timezone: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ScheduleCardProps {
  schedule: Schedule;
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  className?: string;
}

const ScheduleCard = React.forwardRef<HTMLDivElement, ScheduleCardProps>(
  (
    {
      schedule,
      onEdit,
      onDelete,
      onPause,
      onResume,
      className,
    },
    ref
  ) => {
    // Helper to format date
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return '—';
      try {
        return new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).format(new Date(dateStr));
      } catch {
        return dateStr;
      }
    };

    // Helper to get frequency label from cron expression
    const getFrequencyLabel = () => {
      if (!schedule.recurring) return 'Once';
      
      const cron = schedule.cron_expression;
      if (!cron) return 'Custom';
      
      // Parse cron: minute hour day month weekday
      const parts = cron.trim().split(/\s+/);
      if (parts.length < 5) return 'Custom';
      
      const [minute, hour, day, month, weekday] = parts;
      
      // Daily pattern: specific time, any day
      if (day === '*' && month === '*' && weekday === '*') {
        return 'Daily';
      }
      
      // Weekdays pattern: Mon-Fri
      if (weekday === '1-5' || weekday === 'MON-FRI') {
        return 'Weekdays';
      }
      
      // Weekly pattern: specific day of week
      if (day === '*' && month === '*' && weekday !== '*') {
        return 'Weekly';
      }
      
      // Monthly pattern: specific day, any month
      if (day !== '*' && month === '*') {
        return 'Monthly';
      }
      
      return 'Custom';
    };

    // Status badge configuration
    const statusConfig: Record<string, { className: string; label: string }> = {
      active: { 
        className: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
        label: 'Active'
      },
      paused: { 
        className: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
        label: 'Paused'
      },
      completed: { 
        className: 'border-gray-500/50 bg-gray-500/10 text-gray-400',
        label: 'Completed'
      },
      failed: { 
        className: 'border-red-500/50 bg-red-500/10 text-red-400',
        label: 'Failed'
      },
    };

    const currentStatus = statusConfig[schedule.status] || statusConfig.active;
    
    // Animation variants for Framer Motion
    const cardVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    };

    // Type icon
    const TypeIcon = schedule.type === 'reminder' ? Bell : Zap;

    return (
      <motion.div
        ref={ref}
        className={cn(
          'w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#171717] p-5 text-white shadow-lg font-sans hover:border-white/[0.15] transition-all',
          className
        )}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TypeIcon className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-base uppercase tracking-wide text-gray-300">
              {schedule.type}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={currentStatus.className}>
              {currentStatus.label}
            </Badge>
            <button
              onClick={() => onDelete(schedule.id)}
              className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              aria-label="Delete schedule"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <hr className="my-3 border-white/[0.08]" />

        {/* Main Schedule Content */}
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold leading-snug text-white">
            {schedule.content}
          </h3>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {(schedule.status !== 'completed' && schedule.status !== 'failed') && (
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Next run</span>
                  <span className="text-gray-200 text-sm">{formatDate(schedule.next_execution_local || schedule.next_execution)}</span>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-2">
              <RefreshCw className="h-4 w-4 text-blue-400 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Frequency</span>
                <span className="text-sm text-blue-400 font-medium">{getFrequencyLabel()}</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Executed</span>
                <span className="font-medium text-emerald-400 text-sm">{schedule.execution_count} time{schedule.execution_count !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Timezone</span>
                <span className="text-sm text-gray-300">{schedule.timezone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {schedule.status === 'active' && (
            <>
              <Button 
                onClick={() => onEdit(schedule)} 
                className="w-full bg-white text-black hover:bg-gray-200" 
                size="lg"
              >
                Edit
              </Button>
              <Button 
                onClick={() => onPause(schedule.id)} 
                variant="outline" 
                className="w-full bg-transparent border-white/[0.12] text-gray-300 hover:bg-white/5 hover:text-white" 
                size="lg"
              >
                Pause
              </Button>
            </>
          )}
          {schedule.status === 'paused' && (
            <>
              <Button 
                onClick={() => onResume(schedule.id)} 
                className="w-full bg-emerald-500 text-white hover:bg-emerald-600" 
                size="lg"
              >
                Resume
              </Button>
              <Button 
                onClick={() => onEdit(schedule)} 
                variant="outline" 
                className="w-full bg-transparent border-white/[0.12] text-gray-300 hover:bg-white/5 hover:text-white" 
                size="lg"
              >
                Edit
              </Button>
            </>
          )}
          {(schedule.status === 'completed' || schedule.status === 'failed') && (
            <Button 
              onClick={() => onEdit(schedule)} 
              className="w-full col-span-2 bg-white text-black hover:bg-gray-200" 
              size="lg"
            >
              Edit
            </Button>
          )}
        </div>
      </motion.div>
    );
  }
);

ScheduleCard.displayName = 'ScheduleCard';

export { ScheduleCard };

