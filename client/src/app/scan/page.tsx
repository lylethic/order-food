import { Suspense } from 'react';
import ScanInner from './scan-inner';

export default function ScanPage() {
  return (
    <Suspense>
      <ScanInner />
    </Suspense>
  );
}
