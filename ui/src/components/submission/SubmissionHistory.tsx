import React, { useState } from 'react'
import { Download, Trash2, Eye, Calendar, FileText, Filter, Search } from 'lucide-react'

interface Submission {
  id: string
  name: string
  description: string
  createdAt: string
  experimentId: string
  experimentName: string
  findings: Array<{
    issue_title: string
    issue_summary: string
    risk_category: string
    attack_pattern: string
    seed_prompt: string
    harmony_response_walkthroughs: Array<{
      role: string
      content: string
    }>
  }>
  status: 'draft' | 'final' | 'submitted'
  size: number
}

interface SubmissionHistoryProps {
  submissions: Submission[]
  onSelect: (id: string) => void
  onDownload: (id: string) => void
  onDelete: (id: string) => void
}

export const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({
  submissions,
  onSelect,
  onDownload,
  onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'final' | 'submitted'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'findings'>('date')

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="badge badge-warning">Draft</span>
      case 'final':
        return <span className="badge badge-success">Final</span>
      case 'submitted':
        return <span className="badge badge-default">Submitted</span>
      default:
        return <span className="badge badge-secondary">Unknown</span>
    }
  }

  const filteredAndSortedSubmissions = submissions
    .filter(submission => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        if (!submission.name.toLowerCase().includes(searchLower) &&
            !submission.description.toLowerCase().includes(searchLower) &&
            !submission.experimentName.toLowerCase().includes(searchLower)) {
          return false
        }
      }

      // Status filter
      if (filterStatus !== 'all' && submission.status !== filterStatus) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'findings':
          return b.findings.length - a.findings.length
        default: // date
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

  if (submissions.length === 0) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h3>
            <p className="text-gray-600 mb-6">
              Generated submissions will appear here for review and download
            </p>
            <button className="btn-primary">
              Create First Submission
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="select"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="final">Final</option>
                <option value="submitted">Submitted</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="select"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="findings">Sort by Findings</option>
              </select>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredAndSortedSubmissions.length} of {submissions.length} submissions
          </div>
        </div>
      </div>

      {/* Submissions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAndSortedSubmissions.map((submission) => (
          <div key={submission.id} className="card hover:shadow-md transition-shadow">
            <div className="card-content">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-gray-900 truncate">{submission.name}</h4>
                    {getStatusBadge(submission.status)}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{submission.description}</p>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-600">Experiment:</span>
                    <p className="font-medium text-gray-900 truncate">{submission.experimentName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <p className="font-medium text-gray-900">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Findings:</span>
                    <p className="font-medium text-gray-900">{submission.findings.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Size:</span>
                    <p className="font-medium text-gray-900">{formatFileSize(submission.size)}</p>
                  </div>
                </div>
              </div>

              {/* Risk Categories Preview */}
              {submission.findings.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-2">Risk Categories:</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(
                      submission.findings.reduce((acc, finding) => {
                        acc[finding.risk_category] = (acc[finding.risk_category] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)
                    ).slice(0, 3).map(([category, count]) => (
                      <span
                        key={category}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                      >
                        {category} ({count})
                      </span>
                    ))}
                    {Object.keys(
                      submission.findings.reduce((acc, finding) => {
                        acc[finding.risk_category] = true
                        return acc
                      }, {} as Record<string, boolean>)
                    ).length > 3 && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        +{Object.keys(
                          submission.findings.reduce((acc, finding) => {
                            acc[finding.risk_category] = true
                            return acc
                          }, {} as Record<string, boolean>)
                        ).length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(submission.createdAt).toLocaleString()}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onSelect(submission.id)}
                    className="btn-secondary text-sm flex items-center"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => onDownload(submission.id)}
                    className="btn-secondary text-sm flex items-center"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </button>
                  <button
                    onClick={() => onDelete(submission.id)}
                    className="btn-danger text-sm"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State for Filtered Results */}
      {filteredAndSortedSubmissions.length === 0 && submissions.length > 0 && (
        <div className="card">
          <div className="card-content">
            <div className="text-center py-8">
              <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Matching Submissions</h3>
              <p className="text-gray-600 mb-4">
                No submissions match your current search and filter criteria
              </p>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('all')
                }}
                className="btn-secondary"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
