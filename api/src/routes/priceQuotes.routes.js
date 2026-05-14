import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { priceQuoteToJson } from '../lib/priceQuoteSerialize.js';

const router = Router();

function canList(actor) {
  return ['مالك', 'مدير مبيعات', 'محاسب', 'مندوب'].includes(actor.role);
}

function canCreate(actor) {
  return actor.role === 'مندوب' || actor.role === 'مدير مبيعات';
}

router.get('/', requireAuth(), async (req, res) => {
  try {
    if (!canList(req.authUser)) {
      return res.status(403).json({ error: 'غير مصرح' });
    }
    const { role, id: userId } = req.authUser;
    const where = role === 'مندوب' ? { createdById: userId } : {};
    const rows = await prisma.priceQuote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ quotes: rows.map(priceQuoteToJson) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

router.post('/', requireAuth(), async (req, res) => {
  try {
    if (!canCreate(req.authUser)) {
      return res.status(403).json({ error: 'غير مصرح' });
    }
    const body = req.body || {};
    const id = body.id ? String(body.id).trim() : undefined;
    const leadId = String(body.leadId || '').trim();
    const customerName = String(body.customerName || '').trim();
    const title = String(body.title || '').trim();
    const amount = Math.max(0, Math.round(Number(body.amount) || 0));
    if (!leadId || !customerName || !title || !amount) {
      return res.status(400).json({ error: 'بيانات عرض السعر ناقصة' });
    }
    const vatRate = typeof body.vatRate === 'number' ? body.vatRate : 14;
    const vatAmount =
      typeof body.vatAmount === 'number'
        ? Math.round(body.vatAmount)
        : Math.round(amount * (vatRate / 100));
    const totalAmount =
      typeof body.totalAmount === 'number' ? Math.round(body.totalAmount) : amount + vatAmount;
    const row = await prisma.priceQuote.create({
      data: {
        ...(id ? { id } : {}),
        leadId,
        customerName,
        title,
        amount,
        vatRate,
        vatAmount,
        totalAmount,
        costCenter: body.costCenter ? String(body.costCenter).trim() : 'عام',
        note: body.note ? String(body.note).trim() : null,
        createdById: req.authUser.id,
        createdByName: req.authUser.name,
        status: 'قيد اعتماد المالك',
      },
    });
    return res.status(201).json({ quote: priceQuoteToJson(row) });
  } catch (e) {
    console.error(e);
    if (e?.code === 'P2002') {
      return res.status(409).json({ error: 'معرّف عرض السعر مستخدم' });
    }
    return res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

router.patch('/:id', requireAuth(), async (req, res) => {
  try {
    const { id } = req.params;
    const actor = req.authUser;
    const existing = await prisma.priceQuote.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'غير موجود' });

    const patch = req.body || {};
    const data = {};

    if (patch.status != null) {
      const st = String(patch.status).trim();
      if (st === 'مرفوض') {
        if (actor.role !== 'مالك') {
          return res.status(403).json({ error: 'غير مصرح' });
        }
        data.status = 'مرفوض';
        data.approvedBy = actor.name;
        data.approvedAt = new Date();
      } else if (st === 'معتمد') {
        if (actor.role !== 'مالك' && actor.role !== 'مدير مبيعات') {
          return res.status(403).json({ error: 'غير مصرح' });
        }
        data.status = 'معتمد';
        if (patch.approvedBy) data.approvedBy = String(patch.approvedBy);
        else data.approvedBy = actor.name;
        data.approvedAt = patch.approvedAt ? new Date(patch.approvedAt) : new Date();
        if (patch.invoiceId) data.invoiceId = String(patch.invoiceId).trim();
      } else {
        return res.status(400).json({ error: 'حالة غير صالحة' });
      }
    } else {
      return res.status(400).json({ error: 'لا يوجد تحديث' });
    }

    if (existing.status !== 'قيد اعتماد المالك') {
      return res.status(400).json({ error: 'عرض السعر ليس قيد الاعتماد' });
    }

    const row = await prisma.priceQuote.update({ where: { id }, data });
    return res.json({ quote: priceQuoteToJson(row) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

export { router as priceQuotesRouter };
