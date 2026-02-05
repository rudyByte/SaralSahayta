'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Clock, CheckCircle, XCircle, AlertTriangle, Search, Filter, ArrowUpDown, IndianRupee } from 'lucide-react'
import { StatsDashboard } from '@/components/application/stats-dashboard'

type ApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'WITHDRAWN'
type TabType = 'all' | 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'

interface Application {
    id: string
    status: ApplicationStatus
    submittedAt: string | null
    createdAt: string
    updatedAt: string
    documentStatus: string
    disbursementAmount?: number
    scheme: {
        id: string
        schemeName: string
        department: string
        category: string
    }
    _count: {
        documents: number
    }
}

export default function ApplicationsPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<TabType>('all')
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'recent' | 'status' | 'name'>('recent')

    const [stats, setStats] = useState({
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        totalBenefits: 0
    })

    useEffect(() => {
        fetchApplications()
    }, [activeTab, sortBy])

    const fetchApplications = async () => {
        try {
            setLoading(true)
            const statusParam = activeTab === 'all' ? '' : `?status=${activeTab}`
            const response = await fetch(`/api/applications${statusParam}`)
            const data = await response.json()

            let apps = data.applications || []

            // Calculate Stats (simplified, ideally this comes from a dedicated API)
            const allApps = data.applications || []
            setStats({
                total: allApps.length,
                approved: allApps.filter((a: any) => a.status === 'APPROVED' || a.status === 'DISBURSED').length,
                pending: allApps.filter((a: any) => ['SUBMITTED', 'UNDER_REVIEW'].includes(a.status)).length,
                rejected: allApps.filter((a: any) => a.status === 'REJECTED').length,
                totalBenefits: allApps.reduce((acc: number, curr: any) => acc + (curr.disbursementAmount || 0), 0)
            })

            // Sorting
            if (sortBy === 'name') {
                apps.sort((a: any, b: any) => a.scheme.schemeName.localeCompare(b.scheme.schemeName))
            } else if (sortBy === 'status') {
                apps.sort((a: any, b: any) => a.status.localeCompare(b.status))
            } else {
                apps.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            }

            setApplications(apps)
        } catch (error) {
            console.error('Failed to fetch applications:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: ApplicationStatus) => {
        const badges: Record<string, { icon: any; color: string; label: string }> = {
            DRAFT: { icon: Clock, color: 'bg-gray-100 text-gray-800', label: 'Draft' },
            SUBMITTED: { icon: Clock, color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
            UNDER_REVIEW: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Under Review' },
            APPROVED: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Approved' },
            REJECTED: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Rejected' },
            DISBURSED: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800', label: 'Disbursed' },
            WITHDRAWN: { icon: XCircle, color: 'bg-gray-100 text-gray-800', label: 'Withdrawn' }
        }

        const badge = badges[status] || badges.DRAFT
        const Icon = badge.icon

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                <Icon className="h-3 w-3" />
                {badge.label}
            </span>
        )
    }

    const getActionButton = (app: Application) => {
        switch (app.status) {
            case 'DRAFT':
                return (
                    <button
                        onClick={() => router.push(`/applications/${app.id}`)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Continue Application
                    </button>
                )
            default:
                return (
                    <button
                        onClick={() => router.push(`/applications/${app.id}/track`)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors font-medium text-gray-700"
                    >
                        Track Progress
                    </button>
                )
        }
    }

    const filteredApplications = applications.filter(app =>
        app.scheme.schemeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.id.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const tabs = [
        { key: 'all', label: 'All' },
        { key: 'draft', label: 'Draft' },
        { key: 'submitted', label: 'Submitted' },
        { key: 'under_review', label: 'Under Review' },
        { key: 'approved', label: 'Approved' },
        { key: 'rejected', label: 'Rejected' }
    ]

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
                    <p className="text-gray-600 mt-2">
                        Track and manage your scheme applications and benefits
                    </p>
                </div>
                <button
                    onClick={() => router.push('/discover')}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 active:scale-95"
                >
                    New Application
                </button>
            </div>

            {/* Stats Dashboard */}
            <div className="mb-10">
                <StatsDashboard stats={stats} />
            </div>

            {/* Search & Sort */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by scheme name or application ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="appearance-none pl-10 pr-10 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 text-sm font-semibold outline-none cursor-pointer transition-all hover:bg-gray-50"
                        >
                            <option value="recent">Recently Updated</option>
                            <option value="status">Filter by Status</option>
                            <option value="name">Scheme Name A-Z</option>
                        </select>
                        <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    <button className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                        <Filter className="h-5 w-5 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-8 overflow-x-auto scrollbar-hide">
                <nav className="flex gap-8 min-w-max">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as TabType)}
                            className={`py-4 px-1 border-b-2 font-semibold transition-all relative ${activeTab === tab.key
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.key && (
                                <span className="ml-2 bg-blue-100 text-blue-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                    {filteredApplications.length}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-72 bg-gray-50 animate-pulse rounded-2xl border border-gray-100" />
                    ))}
                </div>
            )}

            {/* Applications Grid */}
            {!loading && filteredApplications.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredApplications.map(app => (
                        <div key={app.id} className="group border border-gray-200 rounded-2xl p-6 bg-white hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2.5 bg-gray-50 group-hover:bg-blue-50 rounded-xl transition-colors">
                                    <FileText className="h-6 w-6 text-gray-400 group-hover:text-blue-500" />
                                </div>
                                {getStatusBadge(app.status)}
                            </div>

                            {/* Scheme Info */}
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3rem] group-hover:text-blue-600 transition-colors leading-tight">
                                    {app.scheme.schemeName}
                                </h3>
                                <p className="text-sm text-gray-500 font-medium mb-1">{app.scheme.department}</p>
                                <p className="text-[10px] font-mono text-gray-400 mb-6 tracking-tight">
                                    REF: {app.id.slice(0, 18)}...
                                </p>

                                {/* Date Info */}
                                <div className="text-xs text-gray-500 mb-6 flex items-center gap-2 font-medium">
                                    <Clock className="h-3.5 w-3.5" />
                                    {app.status === 'DRAFT' ? (
                                        <span>Last edited on {new Date(app.updatedAt).toLocaleDateString()}</span>
                                    ) : (
                                        <span>Submitted on {new Date(app.submittedAt!).toLocaleDateString()}</span>
                                    )}
                                </div>

                                {/* Progress bar for Drafts / Detailed info for tracking */}
                                {app.status === 'DRAFT' ? (
                                    <div className="mb-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                        <div className="flex items-center justify-between text-[11px] mb-2 font-bold uppercase tracking-wider">
                                            <span className="text-blue-700">Application Progress</span>
                                            <span className="text-blue-700">75%</span>
                                        </div>
                                        <div className="w-full bg-blue-200/50 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full shadow-sm shadow-blue-500/20"
                                                style={{ width: '75%' }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-6 flex items-center gap-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-1">
                                            <FileText className="h-3 w-3" />
                                            {app._count?.documents || 0} Docs
                                        </div>
                                        {app.disbursementAmount && (
                                            <div className="flex items-center gap-1 text-emerald-600">
                                                <IndianRupee className="h-3 w-3" />
                                                {app.disbursementAmount.toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            {getActionButton(app)}
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredApplications.length === 0 && (
                <div className="text-center py-24 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                    <div className="bg-white p-7 rounded-full w-28 h-28 flex items-center justify-center mx-auto mb-8 shadow-sm border border-gray-100">
                        <FileText className="h-12 w-12 text-gray-200" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        {searchQuery ? 'No applications matched your search' : "Ready to avail benefits?"}
                    </h3>
                    <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium">
                        {searchQuery
                            ? 'Try using different keywords or checking other status categories.'
                            : 'Browse multiple categories of government schemes and start applying today.'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => router.push('/discover')}
                            className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30 transition-all active:scale-95"
                        >
                            Discover New Schemes
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

