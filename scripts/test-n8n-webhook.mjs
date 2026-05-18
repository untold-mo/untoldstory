#!/usr/bin/env node
const url =
  process.env.VITE_CLIENT_NOTIFY_WEBHOOK_URL || 'https://n8n.srv1255426.hstgr.cloud/webhook/client-notify';

const body = {
  type: 'quote_approved',
  quoteId: 'TEST-VERIFY',
  customerName: 'اختبار',
  title: 'عرض تجريبي',
  totalAmount: 1000,
};

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
const text = await res.text();
console.log('webhook', url);
console.log('HTTP', res.status, text.slice(0, 300));
