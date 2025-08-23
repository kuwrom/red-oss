import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { TabNavigation } from './components/TabNavigation'
import { ConfigurationTab } from './components/tabs/ConfigurationTab'
import { StrategyControlTab } from './components/tabs/StrategyControlTab'
import { MonitoringTab } from './components/tabs/MonitoringTab'
import { ResultsTab } from './components/tabs/ResultsTab'
import { SubmissionTab } from './components/tabs/SubmissionTab'
import { Header } from './components/Header'
import { ConfigProvider } from './contexts/ConfigContext'
import { ExperimentProvider } from './contexts/ExperimentContext'
import ErrorBoundary from './components/ErrorBoundary'

export type TabType = 'configuration' | 'strategy' | 'monitoring' | 'results' | 'submission'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('configuration')

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'configuration':
        return <ConfigurationTab />
      case 'strategy':
        return <StrategyControlTab />
      case 'monitoring':
        return <MonitoringTab />
      case 'results':
        return <ResultsTab />
      case 'submission':
        return <SubmissionTab />
      default:
        return <ConfigurationTab />
    }
  }

  return (
    <ConfigProvider>
      <ExperimentProvider>
        <ErrorBoundary>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">redxmoro AI Safety Testing</h1>
                <p className="mt-2 text-gray-600">
                  Configuration and monitoring interface for AI safety testing experiments
                </p>
              </div>
              
              <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
              
              <div className="mt-6">
                {renderActiveTab()}
              </div>
            </div>
            
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#374151',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                },
              }}
            />
          </div>
        </ErrorBoundary>
      </ExperimentProvider>
    </ConfigProvider>
  )
}

export default App
