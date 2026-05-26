'use client';

import { X, Printer, UtensilsCrossed, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import { formatVnd } from '@/lib/money';
import { formatPaymentMethod } from '@/lib/payment';
import Image from 'next/image';

export interface InvoiceData {
  ticketNumber: string;
  table: string;
  isPaid: boolean;
  paymentMethod?: string;
  paidAt?: string;
  timestamp: string;
  items: Array<{
    id: string;
    name: string;
    qty: number;
    price: number;
    modifications?: string[];
  }>;
  total: number;
}

interface Props {
  data: InvoiceData;
  onClose: () => void;
}

function buildPrintHtml(
  data: InvoiceData,
  lang: string,
  qrImageUrl: string,
): string {
  const fmt = (n: number) =>
    `${new Intl.NumberFormat('vi-VN').format(Math.round(n))} VND`;

  const paidDate = data.paidAt
    ? new Date(data.paidAt).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')
    : '--';

  const rows = data.items
    .map(
      (item) => `
      <tr>
        <td class="item-cell">
          <div class="item-name">${item.name}</div>
          ${(item.modifications ?? []).map((m) => `<div class="item-mod">${m}</div>`).join('')}
        </td>
        <td class="center">${item.qty}</td>
        <td class="right">${fmt(item.price)}</td>
        <td class="right bold">${fmt(item.price * item.qty)}</td>
      </tr>`,
    )
    .join('');

  const t = {
    orderInfo: lang === 'vi' ? 'Thông tin đơn hàng' : 'Order Info',
    table: lang === 'vi' ? 'Bàn' : 'Table',
    orderTime: lang === 'vi' ? 'Thời gian' : 'Order Time',
    statusLabel: lang === 'vi' ? 'Trạng thái' : 'Status',
    paid: lang === 'vi' ? 'Đã thanh toán' : 'Paid',
    unpaid: lang === 'vi' ? 'Chưa thanh toán' : 'Unpaid',
    paymentInfo: lang === 'vi' ? 'Thanh toán' : 'Payment',
    method: lang === 'vi' ? 'Phương thức' : 'Method',
    paidAt: lang === 'vi' ? 'Thời điểm' : 'Paid At',
    item: lang === 'vi' ? 'Món ăn' : 'Item',
    qty: lang === 'vi' ? 'SL' : 'Qty',
    unitPrice: lang === 'vi' ? 'Đơn giá' : 'Unit Price',
    amount: lang === 'vi' ? 'Thành tiền' : 'Amount',
    total: lang === 'vi' ? 'TỔNG CỘNG' : 'TOTAL',
    thanks:
      lang === 'vi' ? 'Cảm ơn quý khách!' : 'Thank you for dining with us!',
    seeYou:
      lang === 'vi'
        ? 'Hẹn gặp lại quý khách!'
        : 'We hope to see you again soon!',
    tagline:
      lang === 'vi'
        ? 'Ẩm thực tinh tế, trong tầm tay.'
        : 'Fine dining, at your fingertips.',
    transferTitle:
      lang === 'vi' ? 'Quét QR để chuyển khoản' : 'Scan QR for bank transfer',
    transferNote:
      lang === 'vi'
        ? 'Vui lòng chuyển khoản đúng nội dung để đối soát nhanh.'
        : 'Please include the correct payment note for faster reconciliation.',
  };

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice #${data.ticketNumber}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1e293b;padding:40px;max-width:680px;margin:0 auto;font-size:14px}
    @media print{body{padding:20px}}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #e2e8f0}
    .logo-row{display:flex;align-items:center;gap:10px;margin-bottom:6px}
    .logo-box{width:38px;height:38px;background:#4f46e5;border-radius:10px;display:flex;align-items:center;justify-content:center}
    .logo-name{font-weight:900;font-size:22px;letter-spacing:-.5px;font-style:italic;text-transform:uppercase;color:#1e293b}
    .tagline{font-size:12px;color:#64748b;margin-top:2px}
    .invoice-label{font-size:28px;font-weight:900;color:#4f46e5;letter-spacing:-1px;text-align:right}
    .invoice-num{font-size:13px;font-weight:700;color:#64748b;text-align:right;margin-top:4px}
    .meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px}
    .meta-box{background:#f8fafc;border-radius:12px;padding:16px}
    .meta-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:12px}
    .meta-row{display:flex;justify-content:space-between;margin-bottom:8px}
    .meta-row:last-child{margin-bottom:0}
    .meta-label{font-size:13px;color:#64748b}
    .meta-value{font-size:13px;font-weight:700;color:#1e293b}
    .status-paid{color:#059669}
    .status-unpaid{color:#d97706}
    table{width:100%;border-collapse:collapse;margin-bottom:24px}
    thead tr{background:#f1f5f9}
    th{padding:10px 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#64748b}
    th:first-child{text-align:left;border-radius:8px 0 0 8px}
    th:last-child{border-radius:0 8px 8px 0}
    .center{text-align:center}
    .right{text-align:right}
    td{padding:10px 8px;border-bottom:1px solid #f1f5f9;vertical-align:top}
    .item-cell{text-align:left}
    .item-name{font-weight:700;color:#1e293b}
    .item-mod{font-size:11px;color:#94a3b8;margin-top:2px}
    .bold{font-weight:700;color:#1e293b}
    .total-section{display:flex;justify-content:flex-end;margin-bottom:32px}
    .total-box{width:280px;background:#f8fafc;border-radius:12px;padding:16px}
    .total-row{display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:2px solid #e2e8f0}
    .total-label{font-size:16px;font-weight:900;color:#1e293b}
    .total-value{font-size:20px;font-weight:900;color:#4f46e5}
    .footer{text-align:center;padding:24px 0 0;border-top:1px solid #e2e8f0}
    .footer-main{font-size:15px;font-weight:700;color:#1e293b;margin-bottom:6px}
    .footer-sub{font-size:13px;color:#94a3b8}
    .transfer-box{margin:24px 0 8px;padding:20px;border:1px solid #c7d2fe;border-radius:18px;background:#eef2ff;display:flex;gap:20px;align-items:center}
    .transfer-img{width:200px;height:200px;flex:0 0 160px;border-radius:16px;object-fit:cover;background:#fff;border:1px solid #e2e8f0}
    .transfer-copy{flex:1;min-width:0}
    .transfer-title{font-size:18px;font-weight:900;color:#312e81;margin-bottom:8px}
    .transfer-note{font-size:13px;color:#4b5563;line-height:1.5}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo-row">
        <div class="logo-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
            <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
          </svg>
        </div>
        <span class="logo-name">RUBYKET</span>
      </div>
      <p class="tagline">${t.tagline}</p>
    </div>
    <div>
      <p class="invoice-label">INVOICE</p>
      <p class="invoice-num">#${data.ticketNumber}</p>
    </div>
  </div>
  <div class="meta-grid">
    <div class="meta-box">
      <p class="meta-title">${t.orderInfo}</p>
      <div class="meta-row"><span class="meta-label">${t.table}</span><span class="meta-value">${data.table}</span></div>
      <div class="meta-row"><span class="meta-label">${t.orderTime}</span><span class="meta-value">${data.timestamp}</span></div>
      <div class="meta-row"><span class="meta-label">${t.statusLabel}</span><span class="meta-value ${data.isPaid ? 'status-paid' : 'status-unpaid'}">${data.isPaid ? t.paid : t.unpaid}</span></div>
    </div>
    <div class="meta-box">
      <p class="meta-title">${t.paymentInfo}</p>
      <div class="meta-row"><span class="meta-label">${t.method}</span><span class="meta-value">${formatPaymentMethod(data.paymentMethod, lang)}</span></div>
      <div class="meta-row"><span class="meta-label">${t.paidAt}</span><span class="meta-value">${paidDate}</span></div>
    </div>
  </div>
  <div class="transfer-box">
    <img class="transfer-img" src="${qrImageUrl}" alt="QR Transfer" />
    <div class="transfer-copy">
      <div class="transfer-title">${t.transferTitle}</div>
      <div class="transfer-note">${t.transferNote}</div>
    </div>
  </div>
  <table>
    <thead><tr><th>${t.item}</th><th class="center">${t.qty}</th><th class="right">${t.unitPrice}</th><th class="right">${t.amount}</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="total-section"><div class="total-box"><div class="total-row"><span class="total-label">${t.total}</span><span class="total-value">${fmt(data.total)}</span></div></div></div>
  <div class="footer"><p class="footer-main">${t.thanks}</p><p class="footer-sub">${t.seeYou}</p></div>
</body>
</html>`;
}

export default function InvoiceModal({ data, onClose }: Props) {
  const { lang } = useAppContext();
  const isVi = lang === 'vi';

  const handlePrint = () => {
    const qrImageUrl = `${window.location.origin}/images/QR_Transfer.jpg`;
    const html = buildPrintHtml(data, lang, qrImageUrl);
    const win = window.open('', '_blank', 'width=780,height=900');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'>
      <div className='rounded-[28px] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden bg-white'>
        <div className='flex items-center justify-between px-6 pt-6 pb-4 border-b border-border shrink-0'>
          <div>
            <h2 className='text-lg font-extrabold text-foreground'>
              {isVi ? 'Hóa đơn' : 'Invoice'} #{data.ticketNumber}
            </h2>
            <p className='text-xs text-muted-foreground font-medium mt-0.5'>
              {isVi ? 'Bàn' : 'Table'} {data.table} · {data.timestamp}
            </p>
          </div>
          <button
            onClick={onClose}
            className='text-muted-foreground hover:text-muted-foreground transition-colors p-1.5 rounded-xl hover:bg-accent'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto px-6 py-5 space-y-5'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2.5'>
              <div className='w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-100'>
                <UtensilsCrossed
                  className='w-4 h-4 text-white'
                  strokeWidth={2.5}
                />
              </div>
              <span className='font-extrabold text-lg text-foreground italic uppercase tracking-tight'>
                RUBYKET
              </span>
            </div>
            <span className='text-2xl font-black text-indigo-600 tracking-tight'>
              INVOICE
            </span>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='bg-muted/50 rounded-2xl p-3.5 border border-border'>
              <p className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5'>
                {isVi ? 'Thông tin đơn' : 'Order Info'}
              </p>
              <div className='space-y-1.5'>
                <div className='flex justify-between text-xs'>
                  <span className='text-muted-foreground'>
                    {isVi ? 'Bàn' : 'Table'}
                  </span>
                  <span className='font-bold text-foreground'>
                    {data.table}
                  </span>
                </div>
                <div className='flex justify-between text-xs'>
                  <span className='text-muted-foreground'>
                    {isVi ? 'Thời gian' : 'Time'}
                  </span>
                  <span className='font-bold text-foreground text-right max-w-[110px] leading-tight'>
                    {data.timestamp}
                  </span>
                </div>
                <div className='flex justify-between text-xs'>
                  <span className='text-muted-foreground'>
                    {isVi ? 'Trạng thái' : 'Status'}
                  </span>
                  <span
                    className={`font-bold ${data.isPaid ? 'text-emerald-600' : 'text-amber-600'}`}
                  >
                    {data.isPaid
                      ? isVi
                        ? 'Đã TT'
                        : 'Paid'
                      : isVi
                        ? 'Chưa TT'
                        : 'Unpaid'}
                  </span>
                </div>
              </div>
            </div>
            <div className='bg-muted/50 rounded-2xl p-3.5 border border-border'>
              <p className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5'>
                {isVi ? 'Thanh toán' : 'Payment'}
              </p>
              <div className='space-y-1.5'>
                <div className='flex justify-between text-xs'>
                  <span className='text-muted-foreground'>
                    {isVi ? 'Phương thức' : 'Method'}
                  </span>
                  <span className='font-bold text-foreground'>
                    {formatPaymentMethod(data.paymentMethod, lang)}
                  </span>
                </div>
                <div className='flex justify-between text-xs'>
                  <span className='text-muted-foreground'>
                    {isVi ? 'Thời điểm' : 'Paid At'}
                  </span>
                  <span className='font-bold text-foreground text-right max-w-[110px] leading-tight'>
                    {data.paidAt
                      ? new Date(data.paidAt).toLocaleString(
                          lang === 'vi' ? 'vi-VN' : 'en-US',
                        )
                      : '--'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5'>
              {isVi ? 'Danh sách món' : 'Items'}
            </p>
            <div className='rounded-2xl border border-border overflow-hidden'>
              <table className='w-full text-xs'>
                <thead>
                  <tr className='bg-muted/50'>
                    <th className='px-3 py-2 text-left font-bold text-muted-foreground uppercase tracking-wider'>
                      {isVi ? 'Món ăn' : 'Item'}
                    </th>
                    <th className='px-3 py-2 text-center font-bold text-muted-foreground uppercase tracking-wider w-10'>
                      {isVi ? 'SL' : 'Qty'}
                    </th>
                    <th className='px-3 py-2 text-right font-bold text-muted-foreground uppercase tracking-wider'>
                      {isVi ? 'Đơn giá' : 'Price'}
                    </th>
                    <th className='px-3 py-2 text-right font-bold text-muted-foreground uppercase tracking-wider'>
                      {isVi ? 'T.tiền' : 'Total'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, i) => (
                    <tr
                      key={item.id}
                      className={i % 2 === 0 ? 'bg-white' : 'bg-muted/50/50'}
                    >
                      <td className='px-3 py-2.5'>
                        <p className='font-bold text-foreground'>{item.name}</p>
                        {(item.modifications ?? []).map((m) => (
                          <p
                            key={m}
                            className='text-muted-foreground text-[10px]'
                          >
                            {m}
                          </p>
                        ))}
                      </td>
                      <td className='px-3 py-2.5 text-center font-extrabold text-indigo-600'>
                        {item.qty}
                      </td>
                      <td className='px-3 py-2.5 text-right text-muted-foreground font-medium'>
                        {formatVnd(item.price)}
                      </td>
                      <td className='px-3 py-2.5 text-right font-bold text-foreground'>
                        {formatVnd(item.price * item.qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className='flex justify-end'>
            <div className='bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-3.5 flex items-center gap-6'>
              <span className='text-sm font-extrabold text-foreground uppercase tracking-wide'>
                {isVi ? 'Tổng cộng' : 'Total'}
              </span>
              <span className='text-xl font-black text-indigo-600'>
                {formatVnd(data.total)}
              </span>
            </div>
          </div>

          <div className='rounded-3xl border border-indigo-100 bg-indigo-50/70 p-4 flex flex-col sm:flex-row items-center gap-4'>
            <div className='relative w-full h-32 sm:h-40 md:h-48 overflow-hidden rounded-2xl'>
              <Image
                src='images/QR_Transfer.jpg'
                alt='QR Transfer'
                fill
                unoptimized
                sizes='60px'
                className='object-contain'
              />
            </div>
            <div className='text-center sm:text-left'>
              <p className='text-base font-extrabold text-indigo-900'>
                {isVi ? 'Quét QR để chuyển khoản' : 'Scan QR for bank transfer'}
              </p>
              <p className='text-sm text-muted-foreground mt-1 leading-relaxed'>
                {isVi
                  ? 'Vui lòng chuyển khoản đúng nội dung để đối soát nhanh.'
                  : 'Please include the correct payment note for faster reconciliation.'}
              </p>
            </div>
          </div>

          {data.isPaid && (
            <div className='flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3'>
              <CheckCircle2 className='w-4 h-4 text-emerald-500 shrink-0' />
              <p className='text-sm font-bold text-emerald-700'>
                {isVi
                  ? 'Cảm ơn quý khách! Hẹn gặp lại.'
                  : 'Thank you for dining with us!'}
              </p>
            </div>
          )}
        </div>

        <div className='px-6 pb-6 pt-4 border-t border-border shrink-0'>
          <button
            onClick={handlePrint}
            className='w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-100'
          >
            <Printer className='w-4 h-4' />
            {isVi ? 'In / Tải hóa đơn PDF' : 'Print / Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
