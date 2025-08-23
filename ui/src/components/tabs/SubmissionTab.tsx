import React, { useState, useEffect } from 'react'
import { FileText, Download, Upload, Plus, Trash2, Edit3, Check, X } from 'lucide-react'
import { useExperiment } from '../../contexts/ExperimentContext'
import { SubmissionGenerator } from '../submission/SubmissionGenerator'
import { SubmissionPreview } from '../submission/SubmissionPreview'
import { SubmissionHistory } from '../submission/SubmissionHistory'

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

type ViewMode = 'generator' | 'preview' | 'history'

export const SubmissionTab: React.FC = () => {
  const { currentExperiment, events } = useExperiment()
  const [viewMode, setViewMode] = useState<ViewMode>('generator')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions')
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data)
      }
    } catch (error) {
      console.error('Failed to load submissions:', error)
    }
  }

  const createSubmission = async (config: {
    name: string
    description: string
    includeNovelMethods: boolean
    includeSuccessfulAttacks: boolean
    includeFailedAttacks: boolean
  }) => {
    setLoading(true)
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          experimentId: currentExperiment?.id,
          experimentName: currentExperiment?.name
        })
      })

      if (response.ok) {
        const submission = await response.json()
        setSubmissions(prev => [submission, ...prev])
        setSelectedSubmission(submission.id)
        setViewMode('preview')
      }
    } catch (error) {
      console.error('Failed to create submission:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadSubmission = async (submissionId: string) => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `submission_${submissionId}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to download submission:', error)
    }
  }

  const deleteSubmission = async (submissionId: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return

    try {
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setSubmissions(prev => prev.filter(s => s.id !== submissionId))
        if (selectedSubmission === submissionId) {
          setSelectedSubmission(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete submission:', error)
    }
  }

  const renderViewContent = () => {
    switch (viewMode) {
      case 'preview':
        const submission = submissions.find(s => s.id === selectedSubmission)
        return submission ? (
          <SubmissionPreview 
            submission={submission}
            onDownload={() => downloadSubmission(submission.id)}
            onDelete={() => deleteSubmission(submission.id)}
          />
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Select a submission to preview</p>
          </div>
        )
      case 'history':
        return (
          <SubmissionHistory
            submissions={submissions}
            onSelect={setSelectedSubmission}
            onDownload={downloadSubmission}
            onDelete={deleteSubmission}
          />
        )
      default:
        return (
          <SubmissionGenerator
            onGenerate={createSubmission}
            loading={loading}
            hasExperiment={!!currentExperiment}
          />
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Submission Management</h2>
              <p className="text-gray-600 mt-1">
                Generate and manage findings submissions for competitions and evaluations
              </p>
            </div>
            
            {/* View Mode Selector */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('generator')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'generator'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Generator
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'preview'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setViewMode('history')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'history'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                History
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Draft Submissions</p>
                <p className="text-2xl font-bold text-warning-600">
                  {submissions.filter(s => s.status === 'draft').length}
                </p>
              </div>
              <Edit3 className="w-8 h-8 text-warning-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Final Submissions</p>
                <p className="text-2xl font-bold text-success-600">
                  {submissions.filter(s => s.status === 'final').length}
                </p>
              </div>
              <Check className="w-8 h-8 text-success-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Findings</p>
                <p className="text-2xl font-bold text-primary-600">
                  {submissions.reduce((total, s) => total + s.findings.length, 0)}
                </p>
              </div>
              <Download className="w-8 h-8 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div>
        {renderViewContent()}
      </div>
    </div>
  )
}
