'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';
import { QrCode, Download, Printer, Layers, Hash } from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import tableApiRequest from '@/apiRequests/table';
import Spinner from '@/components/restaurant/spinner';

interface QrEntry {
  tableNumber: string;
  url: string;
}

async function downloadQrPng(entry: QrEntry): Promise<void> {
  const wrapper = document.getElementById(`qr-svg-${entry.tableNumber}`);
  const svgEl = wrapper?.querySelector('svg') ?? null;
  if (!svgEl) return;

  const size = 300;
  const padding = 24;
  const labelH = 36;

  const canvas = document.createElement('canvas');
  canvas.width = size + padding * 2;
  canvas.height = size + padding * 2 + labelH;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `Table ${entry.tableNumber}`,
    canvas.width / 2,
    padding + size + labelH / 2 + 4,
  );

  const svgData = new XMLSerializer().serializeToString(svgEl);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  await new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, padding, size, size);
      URL.revokeObjectURL(svgUrl);
      resolve();
    };
    img.src = svgUrl;
  });

  const link = document.createElement('a');
  link.download = `table-${entry.tableNumber}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function printQrCodes(entries: QrEntry[]) {
  const win = window.open('', '_blank');
  if (!win) return;

  const svgBlocks = entries
    .map((e) => {
      const wrapper = document.getElementById(`qr-svg-${e.tableNumber}`);
      const svgEl = wrapper?.querySelector('svg') ?? null;
      const svgHtml = svgEl ? new XMLSerializer().serializeToString(svgEl) : '';
      return `<div class="card"><div class="qr">${svgHtml}</div><div class="label">Table ${e.tableNumber}</div></div>`;
    })
    .join('');

  win.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>QR Codes</title>
<style>
  body{margin:0;font-family:sans-serif;}
  .grid{display:flex;flex-wrap:wrap;gap:24px;padding:24px;}
  .card{width:220px;border:1px solid #e2e8f0;border-radius:12px;padding:16px;text-align:center;page-break-inside:avoid;}
  .qr svg{width:188px;height:188px;}
  .label{margin-top:10px;font-size:16px;font-weight:700;color:#1e293b;}
  @media print{body{-webkit-print-color-adjust:exact;}}
</style></head>
<body><div class="grid">${svgBlocks}</div>
<script>window.onload=function(){window.print();window.close();}<\/script>
</body></html>`);
  win.document.close();
}

const PRESETS = [
  { label: '1–10', from: 1, to: 10 },
  { label: '1–20', from: 1, to: 20 },
  { label: '1–50', from: 1, to: 50 },
  { label: '1–100', from: 1, to: 100 },
];

export default function AdminQRPage() {
  const { t } = useAppContext();
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [qrList, setQrList] = useState<QrEntry[]>([]);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (from < 1 || to < from || to - from > 299) {
      setError('Range must be 1–300 tables.');
      return;
    }
    setError('');
    setGenerating(true);
    try {
      const res = await tableApiRequest.generateQrBatch({ from, to });
      const data = res.payload.data as any;
      const list: { tableNumber: string; url: string }[] = Array.isArray(data)
        ? data
        : (data?.tables ?? data?.qrCodes ?? data?.data ?? []);
      setQrList(
        list.map((item) => ({
          tableNumber: String(item.tableNumber ?? (item as any).table_number ?? ''),
          url: String(item.url ?? (item as any).qrUrl ?? (item as any).qr_url ?? ''),
        })),
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (entry: QrEntry) => {
    setDownloadingId(entry.tableNumber);
    await downloadQrPng(entry);
    setDownloadingId(null);
  };

  return (
    <div className='p-6 max-w-6xl mx-auto'>
      <div className='mb-8'>
        <h1 className='text-2xl font-extrabold text-foreground flex items-center gap-2'>
          <QrCode className='w-6 h-6 text-indigo-600' />
          {t.qrPageTitle}
        </h1>
        <p className='text-muted-foreground text-sm mt-1'>{t.qrPageSubtitle}</p>
      </div>

      <div className='rounded-2xl border border-border p-6 mb-8 shadow-sm'>
        <h2 className='text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5'>
          <Layers className='w-4 h-4' />
          Batch Generate
        </h2>

        <div className='flex flex-wrap gap-2 mb-4'>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setFrom(p.from);
                setTo(p.to);
              }}
              className='px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-muted-foreground hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors'
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className='flex flex-wrap items-end gap-3'>
          <div>
            <label className='block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1'>
              {t.qrRangeFrom}
            </label>
            <input
              type='number'
              min={1}
              max={300}
              value={from}
              onChange={(e) => setFrom(Number(e.target.value))}
              className='w-28 px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400'
            />
          </div>
          <div>
            <label className='block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1'>
              {t.qrRangeTo}
            </label>
            <input
              type='number'
              min={1}
              max={300}
              value={to}
              onChange={(e) => setTo(Number(e.target.value))}
              className='w-28 px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400'
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className='px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-colors'
          >
            {generating ? (
              <>
                <Spinner size='sm' /> {t.qrGenerating}
              </>
            ) : (
              <>
                <Hash className='w-4 h-4' /> {t.qrGenerate}
              </>
            )}
          </button>
          {qrList.length > 0 && (
            <button
              onClick={() => printQrCodes(qrList)}
              className='px-5 py-2 bg-muted hover:bg-muted text-foreground text-sm font-bold rounded-xl flex items-center gap-2 transition-colors'
            >
              <Printer className='w-4 h-4' />
              {t.qrPrintAll}
            </button>
          )}
        </div>

        {error && (
          <p className='mt-3 text-sm text-rose-500 font-medium'>{error}</p>
        )}
      </div>

      {qrList.length === 0 ? (
        <div className='text-center py-16 text-muted-foreground'>
          <QrCode className='w-12 h-12 mx-auto mb-3 opacity-30' />
          <p className='text-sm'>{t.qrNoQr}</p>
        </div>
      ) : (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
          {qrList.map((entry) => (
            <div
              key={entry.tableNumber}
              className='rounded-2xl border border-border p-4 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-shadow'
            >
              <div id={`qr-svg-${entry.tableNumber}`}>
                <QRCode
                  value={entry.url}
                  size={148}
                  bgColor='#ffffff'
                  fgColor='#1e293b'
                  level='M'
                />
              </div>
              <p className='text-sm font-extrabold text-foreground'>
                {t.qrTableBadge} {entry.tableNumber}
              </p>
              <button
                onClick={() => handleDownload(entry)}
                disabled={downloadingId === entry.tableNumber}
                className='w-full flex items-center justify-center gap-1.5 px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-700 border border-border hover:border-indigo-300 text-muted-foreground text-xs font-semibold rounded-xl transition-colors disabled:opacity-50'
              >
                {downloadingId === entry.tableNumber ? (
                  <Spinner size='sm' />
                ) : (
                  <Download className='w-3.5 h-3.5' />
                )}
                {t.qrDownloadPng}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
