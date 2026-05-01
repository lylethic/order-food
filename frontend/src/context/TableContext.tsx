import { createContext, useContext, useState, type ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TableSession {
  tableNumber: string;
  verifiedAt: string;
  /** 'qr' = scanned from QR code, 'manual' = typed by user */
  source: 'qr' | 'manual';
}

interface TableContextValue {
  tableSession: TableSession | null;
  setTableSession: (session: TableSession | null) => void;
  clearTableSession: () => void;
}

// ─── Storage key ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'table_session';

function readStorage(): TableSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TableSession) : null;
  } catch {
    return null;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TableContext = createContext<TableContextValue | null>(null);

export function TableProvider({ children }: { children: ReactNode }) {
  const [tableSession, setTableSessionState] = useState<TableSession | null>(
    readStorage,
  );

  const setTableSession = (session: TableSession | null) => {
    setTableSessionState(session);
    if (session) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearTableSession = () => setTableSession(null);

  return (
    <TableContext.Provider
      value={{ tableSession, setTableSession, clearTableSession }}
    >
      {children}
    </TableContext.Provider>
  );
}

export function useTableSession(): TableContextValue {
  const ctx = useContext(TableContext);
  if (!ctx)
    throw new Error('useTableSession must be used inside <TableProvider>');
  return ctx;
}
