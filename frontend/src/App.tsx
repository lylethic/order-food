import { LangProvider } from './context/LangContext';
import { AuthProvider } from './context/AuthContext';
import { TableProvider } from './context/TableContext';
import AppRouter from './router/AppRouter';

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <TableProvider>
          <AppRouter />
        </TableProvider>
      </AuthProvider>
    </LangProvider>
  );
}
