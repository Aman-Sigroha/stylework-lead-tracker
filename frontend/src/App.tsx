import { AuthGate } from './features/auth/AuthGate.tsx';

function App() {
  return (
    <div className="app-shell">
      <AuthGate />
    </div>
  );
}

export default App;
