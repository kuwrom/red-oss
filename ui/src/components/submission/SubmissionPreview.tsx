import React, { useState } from 'react'
import { Download, Trash2, Eye, EyeOff, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

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

interface SubmissionPreviewProps {
  submission: Submission
  onDownload: () => void
  onDelete: () => void
}

export const SubmissionPreview: React.FC<SubmissionPreviewProps> = ({
  submission,
  onDownload,
  onDelete
}) => {
  const [expandedFinding, setExpandedFinding] = useState<number | null>(null)
  const [showSensitive, setShowSensitive] = useState(false)

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

  const getRiskCategoryColor = (category: string) => {
    const lowerCase = category.toLowerCase()
    if (lowerCase.includes('critical') || lowerCase.includes('high')) {
      return 'text-danger-700 bg-danger-100'
    }
    if (lowerCase.includes('medium') || lowerCase.includes('moderate')) {
      return 'text-warning-700 bg-warning-100'
    }
    if (lowerCase.includes('low')) {
      return 'text-success-700 bg-success-100'
    }
    return 'text-gray-700 bg-gray-100'
  }

  const maskSensitiveContent = (content: string) => {
    if (showSensitive) return content
    
    // Basic masking for demo purposes
    return content.replace(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, '****-****-****-****')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***@***.***')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-xl font-semibold text-gray-900">{submission.name}</h3>
                {getStatusBadge(submission.status)}
              </div>
              <p className="text-gray-600 mb-4">{submission.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Experiment:</span>
                  <p className="text-gray-900">{submission.experimentName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <p className="text-gray-900">{new Date(submission.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Findings:</span>
                  <p className="text-gray-900">{submission.findings.length}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Size:</span>
                  <p className="text-gray-900">{formatFileSize(submission.size)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => setShowSensitive(!showSensitive)}
                className="btn-secondary text-sm flex items-center"
              >
                {showSensitive ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showSensitive ? 'Hide' : 'Show'} Sensitive
              </button>
              <button
                onClick={onDownload}
                className="btn-primary flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
              <button
                onClick={onDelete}
                className="btn-danger flex items-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Findings Overview */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Findings Summary</h4>
          <p className="card-description">
            Overview of security findings included in this submission
          </p>
        </div>
        <div className="card-content">
          {submission.findings.length > 0 ? (
            <div className="space-y-4">
              {/* Risk Categories Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Risk Categories</h5>
                  <div className="space-y-2">
                    {Object.entries(
                      submission.findings.reduce((acc, finding) => {
                        acc[finding.risk_category] = (acc[finding.risk_category] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)
                    ).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskCategoryColor(category)}`}>
                          {category}
                        </span>
                        <span className="text-sm text-gray-600">{count} finding{count !== 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Attack Patterns</h5>
                  <div className="space-y-2">
                    {Object.entries(
                      submission.findings.reduce((acc, finding) => {
                        acc[finding.attack_pattern] = (acc[finding.attack_pattern] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)
                    ).slice(0, 5).map(([pattern, count]) => (
                      <div key={pattern} className="flex items-center justify-between">
                        <span className="text-sm text-gray-900 truncate">{pattern}</span>
                        <span className="text-sm text-gray-600">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No findings in this submission</p>
          )}
        </div>
      </div>

      {/* Detailed Findings */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Detailed Findings</h4>
          <p className="card-description">
            Individual security findings with complete attack walkthroughs
          </p>
        </div>
        <div className="card-content">
          {submission.findings.length > 0 ? (
            <div className="space-y-4">
              {submission.findings.map((finding, index) => (
                <div key={index} className="border border-gray-200 rounded-lg">
                  {/* Finding Header */}
                  <button
                    onClick={() => setExpandedFinding(expandedFinding === index ? null : index)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h5 className="font-medium text-gray-900">{finding.issue_title}</h5>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskCategoryColor(finding.risk_category)}`}>
                            {finding.risk_category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{finding.issue_summary}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Pattern: {finding.attack_pattern}</span>
                          <span>Walkthrough: {finding.harmony_response_walkthroughs.length} steps</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        {expandedFinding === index ? (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {expandedFinding === index && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      {/* Seed Prompt */}
                      <div className="mb-4">
                        <h6 className="font-medium text-gray-900 mb-2">Initial Seed Prompt</h6>
                        <div className="p-3 bg-white rounded border text-sm text-gray-900">
                          {maskSensitiveContent(finding.seed_prompt)}
                        </div>
                      </div>

                      {/* Walkthrough */}
                      <div>
                        <h6 className="font-medium text-gray-900 mb-2">
                          Attack Walkthrough ({finding.harmony_response_walkthroughs.length} steps)
                        </h6>
                        <div className="space-y-3">
                          {finding.harmony_response_walkthroughs.map((step, stepIndex) => (
                            <div
                              key={stepIndex}
                              className={`p-3 rounded border text-sm ${
                                step.role === 'attacker'
                                  ? 'bg-red-50 border-red-200 ml-4'
                                  : step.role === 'target'
                                  ? 'bg-blue-50 border-blue-200 mr-4'
                                  : 'bg-white border-gray-200'
                              }`}
                            >
                              <div className="flex items-center mb-2">
                                <span className={`text-xs font-medium px-2 py-1 rounded ${
                                  step.role === 'attacker'
                                    ? 'bg-red-100 text-red-800'
                                    : step.role === 'target'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {step.role.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-gray-900 whitespace-pre-wrap">
                                {maskSensitiveContent(step.content)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h5 className="font-medium text-gray-900 mb-2">No Findings</h5>
              <p className="text-gray-600">
                This submission doesn't contain any security findings
              </p>
            </div>
          )}
        </div>
      </div>

      {/* JSON Preview */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">JSON Structure Preview</h4>
          <p className="card-description">
            Preview of the submission file structure (first 50 lines)
          </p>
        </div>
        <div className="card-content">
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
              {JSON.stringify(
                {
                  findings: submission.findings.slice(0, 2).map(finding => ({
                    ...finding,
                    seed_prompt: maskSensitiveContent(finding.seed_prompt),
                    harmony_response_walkthroughs: finding.harmony_response_walkthroughs.map(step => ({
                      ...step,
                      content: maskSensitiveContent(step.content.substring(0, 100) + '...')
                    }))
                  }))
                },
                null,
                2
              ).split('\n').slice(0, 50).join('\n')}
              {submission.findings.length > 2 && '\n  ... (truncated)'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
