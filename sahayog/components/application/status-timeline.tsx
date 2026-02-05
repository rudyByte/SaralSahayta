'use client'

import { Check, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

export type ApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'WITHDRAWN'

interface ApplicationHistory {
    id: string
    status: ApplicationStatus
    remarks: string | null
    createdAt: string
    adminComment?: string | null
}

interface StatusTimelineProps {
    history: ApplicationHistory[]
    currentStatus: ApplicationStatus
    estimatedCompletionDays?: number
}

const statusConfig: Record<ApplicationStatus, { name: string; description: string; color: string }> = {
    DRAFT: { name: 'Draft', description: 'Application is being prepared', color: 'gray' },
    SUBMITTED: { name: 'Submitted', description: 'Application received by department', color: 'blue' },
    UNDER_REVIEW: { name: 'Under Review', description: 'Verification in progress', color: 'yellow' },
    APPROVED: { name: 'Approved', description: 'Application approved for benefit', color: 'green' },
    REJECTED: { name: 'Rejected', description: 'Application did not meet criteria', color: 'red' },
    DISBURSED: { name: 'Disbursed', description: 'Benefit amount credited', color: 'green' },
    WITHDRAWN: { name: 'Withdrawn', description: 'Application withdrawn by user', color: 'gray' }
}

export function StatusTimeline({ history, currentStatus, estimatedCompletionDays }: StatusTimelineProps) {
    // Define the standard logical progression for the timeline
    const steps: ApplicationStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED']

    // If rejected or withdrawn, the timeline ends there
    const finalSteps = currentStatus === 'REJECTED' ? ['SUBMITTED', 'UNDER_REVIEW', 'REJECTED'] :
        currentStatus === 'WITHDRAWN' ? ['SUBMITTED', 'WITHDRAWN'] : steps

    return (
        <div className="space-y-8">
            {finalSteps.map((status, index) => {
                const historyItem = history.find(h => h.status === status)
                const isCompleted = !!historyItem
                const isCurrent = currentStatus === status
                const isFuture = !isCompleted && !isCurrent

                const config = statusConfig[status as ApplicationStatus]
                const isLastStep = index === finalSteps.length - 1

                return (
                    <div key={status} className="relative flex gap-4">
                        {/* Connector Line */}
                        {!isLastStep && (
                            <div
                                className={`absolute left-5 top-10 w-0.5 h-full -ml-px ${isCompleted ? 'bg-green-600' : 'border-l-2 border-dashed border-gray-200'
                                    }`}
                            />
                        )}

                        {/* Status Icon */}
                        <div className="relative flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full z-10">
                            {isCompleted ? (
                                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white">
                                    <Check className="h-6 w-6" />
                                </div>
                            ) : isCurrent ? (
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white ring-4 ring-blue-100">
                                    {status === 'UNDER_REVIEW' ? <Loader2 className="h-6 w-6 animate-spin" /> : <Clock className="h-6 w-6" />}
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                    <div className="w-3 h-3 rounded-full bg-current" />
                                </div>
                            )}
                        </div>

                        {/* Status Details */}
                        <div className="flex-1 pb-10">
                            <div className="flex items-center justify-between">
                                <h3 className={`text-lg font-semibold ${isFuture ? 'text-gray-400' : 'text-gray-900'
                                    }`}>
                                    {config.name}
                                </h3>
                                {historyItem && (
                                    <time className="text-sm text-gray-500">
                                        {format(new Date(historyItem.createdAt), 'MMM dd, yyyy HH:mm')}
                                    </time>
                                )}
                            </div>

                            <p className={`mt-1 text-sm ${isFuture ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                {historyItem?.remarks || config.description}
                            </p>

                            {isCurrent && status === 'UNDER_REVIEW' && estimatedCompletionDays && (
                                <div className="mt-2 text-sm text-blue-600 flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    Estimated completion: {estimatedCompletionDays} days
                                </div>
                            )}

                            {historyItem?.adminComment && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-700 italic">
                                    " {historyItem.adminComment} "
                                </div>
                            )}

                            {isCurrent && status === 'REJECTED' && (
                                <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-100 text-sm text-red-700 flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 mt-0.5" />
                                    Please check the communication history for the reason and options to reapply.
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
