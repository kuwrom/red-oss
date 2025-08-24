import React, { useState, useEffect } from 'react'
import { 
  FolderOpen,
  FileText,
  Download,
  Eye,
  Folder,
  File,
  Clock,
  HardDrive,
  Search,
  RefreshCw,
  Code,
  Image,
  Archive
} from 'lucide-react'

interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  modified?: string
  extension?: string
}

interface ExperimentRun {
  id: string
  name: string
  path: string
  created: string
  files: FileItem[]
}

export const ExperimentFileBrowser: React.FC = () => {
  const [experimentRuns, setExperimentRuns] = useState<ExperimentRun[]>([])
  const [selectedRun, setSelectedRun] = useState<ExperimentRun | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadExperimentRuns()
  }, [])

  const loadExperimentRuns = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/files/experiments')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const runs = await response.json()
      
      // Transform API response to match our interface
      const transformedRuns: ExperimentRun[] = runs.map((run: any) => ({
        id: run.id,
        name: run.name,
        path: run.path,
        created: new Date(run.created * 1000).toISOString(), // Convert Unix timestamp
        files: run.files.map((file: any) => ({
          name: file.name,
          path: file.path,
          type: file.type,
          size: file.size,
          extension: file.extension,
          modified: new Date(file.modified * 1000).toISOString() // Convert Unix timestamp
        }))
      }))
      
      setExperimentRuns(transformedRuns)
      if (transformedRuns.length > 0) {
        setSelectedRun(transformedRuns[0])
      }
    } catch (error) {
      console.error('Failed to load experiment runs:', error)
      // Fallback to empty list
      setExperimentRuns([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadFileContent = async (file: FileItem) => {
    setIsLoading(true)
    try {
      if (!selectedRun) {
        throw new Error('No experiment selected')
      }
      
      const response = await fetch(`/api/files/content/${selectedRun.id}/${file.path}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const content = await response.text()
      setFileContent(content)
    } catch (error) {
      console.error('Failed to load file content:', error)
      setFileContent(`Error loading file content: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'directory') {
      return <Folder className="w-4 h-4 text-blue-500" />
    }
    
    switch (file.extension) {
      case 'json':
      case 'jsonl':
        return <Code className="w-4 h-4 text-green-500" />
      case 'txt':
      case 'log':
        return <FileText className="w-4 h-4 text-gray-500" />
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <Image className="w-4 h-4 text-purple-500" />
      case 'zip':
      case 'tar':
      case 'gz':
        return <Archive className="w-4 h-4 text-orange-500" />
      default:
        return <File className="w-4 h-4 text-gray-400" />
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleString()
  }

  const filteredFiles = selectedRun?.files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <HardDrive className="w-5 h-5 mr-2" />
              Experiment File Browser
            </h2>
            <button
              onClick={loadExperimentRuns}
              disabled={isLoading}
              className="btn-secondary text-sm flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Run Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experiment Run:
            </label>
            <select
              value={selectedRun?.id || ''}
              onChange={(e) => {
                const run = experimentRuns.find(r => r.id === e.target.value)
                setSelectedRun(run || null)
                setSelectedFile(null)
                setFileContent('')
              }}
              className="block w-full text-sm border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Select an experiment run...</option>
              {experimentRuns.map(run => (
                <option key={run.id} value={run.id}>
                  {run.name} ({formatDate(run.created)})
                </option>
              ))}
            </select>
          </div>

          {/* File Search */}
          {selectedRun && (
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
              />
            </div>
          )}
        </div>
      </div>

      {selectedRun && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* File List */}
          <div className="card">
            <div className="card-content">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <FolderOpen className="w-4 h-4 mr-2" />
                Files ({filteredFiles.length})
              </h3>
              
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {filteredFiles.map((file, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedFile(file)
                      if (file.type === 'file') {
                        loadFileContent(file)
                      }
                    }}
                    className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                      selectedFile === file
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{formatDate(file.modified)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (selectedRun) {
                            window.open(`/api/files/download/${selectedRun.id}/${file.path}`, '_blank')
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Download file"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* File Content Viewer */}
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  {selectedFile ? selectedFile.name : 'File Content'}
                </h3>
                {selectedFile && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(fileContent)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Copy content"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 rounded border p-3 max-h-96 overflow-auto">
                {selectedFile ? (
                  isLoading ? (
                    <div className="text-center py-4 text-gray-500">
                      <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                      <p>Loading file content...</p>
                    </div>
                  ) : (
                    <pre className="text-xs whitespace-pre-wrap break-words">
                      {fileContent}
                    </pre>
                  )
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Select a file to view its content</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!selectedRun && !isLoading && (
        <div className="card">
          <div className="card-content text-center py-12">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Experiment Runs</h3>
            <p className="text-gray-600">
              Run an experiment to see the generated files and artifacts
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
