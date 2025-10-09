import './App.css';
import { ChatInterface } from './components/ChatInterface';
import { MissionControlPanel } from './components/MissionControlPanel';
import { MissionControlProvider } from './state/MissionControlState';

function App() {
  return (
    <MissionControlProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-full mx-auto py-4 px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  OneAgent
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    v4.7.0 • Constitutional AI Platform
                  </span>
                </h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  System Operational
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Split Screen */}
        <main className="max-w-full mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-9rem)]">
            {/* Chat Interface - Primary Focus */}
            <div className="h-full">
              <ChatInterface />
            </div>

            {/* Mission Control - Secondary Info */}
            <div className="h-full overflow-auto">
              <MissionControlPanel />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t py-2 px-6 text-xs text-gray-500">
          <div className="max-w-full mx-auto flex items-center justify-between">
            <span>
              OneAgent Professional AI Platform • Constitutional AI • BMAD Framework • Quality-First
            </span>
            <span>Backend: http://localhost:8083 • UI: http://localhost:3000</span>
          </div>
        </footer>
      </div>
    </MissionControlProvider>
  );
}

export default App;
