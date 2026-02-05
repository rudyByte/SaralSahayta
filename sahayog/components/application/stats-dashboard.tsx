'use client'

import {
    FileText,
    CheckCircle,
    Clock,
    XCircle,
    IndianRupee,
    TrendingUp
} from 'lucide-react'

interface StatsDashboardProps {
    stats: {
        total: number
        approved: number
        pending: number
        rejected: number
        totalBenefits: number
    }
}

export function StatsDashboard({ stats }: StatsDashboardProps) {
    const cards = [
        {
            label: 'Total Applications',
            value: stats.total,
            icon: FileText,
            color: 'bg-blue-50 text-blue-600',
            borderColor: 'border-blue-100'
        },
        {
            label: 'Approved Applications',
            value: stats.approved,
            icon: CheckCircle,
            color: 'bg-green-50 text-green-600',
            borderColor: 'border-green-100'
        },
        {
            label: 'Pending Review',
            value: stats.pending,
            icon: Clock,
            color: 'bg-yellow-50 text-yellow-600',
            borderColor: 'border-yellow-100'
        },
        {
            label: 'Rejected Applications',
            value: stats.rejected,
            icon: XCircle,
            color: 'bg-red-50 text-red-600',
            borderColor: 'border-red-100'
        }
    ]

    return (
        <div className="space-y-6">
            {/* Primary Benefit Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <p className="text-blue-100 text-sm font-medium mb-1">Total Benefits Received</p>
                        <h2 className="text-4xl font-bold flex items-center gap-1">
                            <IndianRupee className="h-8 w-8" />
                            {stats.totalBenefits.toLocaleString('en-IN')}
                        </h2>
                        <div className="mt-4 flex items-center gap-2 text-blue-100 text-sm">
                            <TrendingUp className="h-4 w-4" />
                            <span>Increased by 12% from last month</span>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <IndianRupee className="h-24 w-24 text-white/10 absolute -right-4 -bottom-4" />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card) => {
                    const Icon = card.icon
                    return (
                        <div
                            key={card.label}
                            className={`bg-white border ${card.borderColor} rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${card.color}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{card.label}</p>
                                    <p className="text-xl font-bold text-gray-900">{card.value}</p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
