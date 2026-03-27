import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

export const backupRestoreProcedure = publicProcedure
  .input(
    z.object({
      marketId: z.string(),
      userId: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    try {
      if (!input.marketId) {
        throw new Error('Market ID is required');
      }

      const key = `backup_${input.marketId}_${input.userId || 'system'}`;
      console.log(`Restoring backup with key: ${key}`);
      let stored: string | null = null;
      
      if (typeof process !== 'undefined' && process.env.KV) {
        const kv = (process.env as any).KV;
        stored = await kv.get(key, { type: 'text' });
        console.log(`Loaded from KV storage: ${stored ? 'found' : 'not found'}`);
      } else {
        console.log("KV storage not available, using in-memory storage");
        if (typeof globalThis !== 'undefined') {
          (globalThis as any).__backupStorage = (globalThis as any).__backupStorage || {};
          stored = (globalThis as any).__backupStorage[key] || null;
          console.log(`Loaded from memory storage: ${stored ? 'found' : 'not found'}`);
        }
      }
      
      if (!stored || stored === 'null' || stored === 'undefined' || stored.trim() === '') {
        console.log("📦 No backup found in cloud");
        return { success: true as const, data: null, message: "📦 هیچ پاشەکەوتکراویک لەسەر Cloud نەدۆزرایەوە" };
      }

      let parsed;
      try {
        parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
        console.log(`Parsed backup data: ${parsed?.debtors?.length || 0} debtors`);
      } catch (parseError) {
        console.error('Error parsing backup data:', parseError);
        return { success: false as const, data: null, message: "Invalid backup data - JSON parse error" };
      }
      
      if (!parsed || typeof parsed !== 'object') {
        console.log("Invalid backup format - not an object");
        return { success: false as const, data: null, message: "Invalid backup format" };
      }

      if (!parsed.debtors || !Array.isArray(parsed.debtors)) {
        console.log("Invalid backup format - debtors not an array");
        return { success: false as const, data: null, message: "Invalid backup format - missing debtors array" };
      }
      
      const debtors = parsed.debtors.map((debtor: any) => ({
        ...debtor,
        totalDebt: Number.isFinite(debtor.totalDebt) ? debtor.totalDebt : 0,
        debtLimit: debtor.debtLimit !== undefined && Number.isFinite(debtor.debtLimit) ? debtor.debtLimit : undefined,
        interestRate: debtor.interestRate !== undefined && Number.isFinite(debtor.interestRate) ? debtor.interestRate : undefined,
      }));
      
      console.log(`✅ Returning ${debtors.length} validated debtors`);
      
      return { 
        success: true as const, 
        data: debtors, 
        timestamp: parsed.timestamp,
        marketId: parsed.marketId,
        version: parsed.version,
        debtorCount: debtors.length,
        message: `✅ ${debtors.length} قەرزدار لە Cloud گەڕاندرایەوە` 
      };
    } catch (error) {
      console.error("❌ Error restoring backup:", error);
      const errorMessage = error instanceof Error ? error.message : String(error || "Failed to restore backup");
      
      let userFriendlyMessage = '❌ هەڵەیەک ڕوویدا لە گەڕاندنەوە';
      if (errorMessage.includes('JSON parse')) {
        userFriendlyMessage = '⚠️ زانیاریەکانی Cloud تێکچوون';
      } else if (errorMessage.includes('Market ID is required')) {
        userFriendlyMessage = '⚠️ ناسنامەی فرۆشگا پێویستە';
      }
      
      return { 
        success: false as const, 
        data: null, 
        message: userFriendlyMessage,
        error: errorMessage,
      };
    }
  });
