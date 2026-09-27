import { AuthGate } from './features/auth/AuthGate.tsx';
import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <div className="app-shell">
      <AuthGate />
      <Analytics />
    </div>
  );
}

export default App;
