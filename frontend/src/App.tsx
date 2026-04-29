import { LangProvider } from './context/LangContext';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './router/AppRouter';

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </LangProvider>
  );
}
