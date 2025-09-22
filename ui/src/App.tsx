import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { OneAgentDashboard } from './components/OneAgentDashboard';
import { MissionControlDashboard } from './components/MissionControlDashboard';
import { MissionControlPanel } from './components/MissionControlPanel';
import { MissionControlProvider } from './state/MissionControlState';

function App() {
  const [count, setCount] = useState(0);

  return (
    <MissionControlProvider>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
      <hr className="my-8 opacity-30" />
      <MissionControlDashboard />
      <OneAgentDashboard />
      <MissionControlPanel />
    </MissionControlProvider>
  );
}

export default App;
