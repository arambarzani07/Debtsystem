import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

const DebtorSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameEn: z.string().optional(),
  phone: z.string().optional(),
  totalDebt: z.number(),
  transactions: z.array(z.any()),
  createdAt: z.string(),
  imageUri: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  currency: z.string().optional(),
  category: z.string().optional(),
  colorTag: z.string().optional(),
  debtLimit: z.number().optional(),
  interestRate: z.number().optional(),
  paymentSchedule: z.array(z.any()).optional(),
  userId: z.string().optional(),
});

export const backupSaveProcedure = publicProcedure
  .input(
    z.object({
      marketId: z.string(),
      userId: z.string().optional(),
      debtors: z.array(DebtorSchema),
      timestamp: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    try {
      if (!input.marketId || !input.timestamp || !Array.isArray(input.debtors)) {
        throw new Error('Invalid input: missing required fields');
      }

      const key = `backup_${input.marketId}_${input.userId || 'system'}`;
      const data = {
        debtors: input.debtors,
        timestamp: input.timestamp,
        marketId: input.marketId,
        userId: input.userId,
        version: "1.0",
      };
      
      const dataString = JSON.stringify(data);
      console.log(`Saving backup for market ${input.marketId}, size: ${dataString.length} bytes, debtors: ${input.debtors.length}`);
      
      if (dataString.length > 10 * 1024 * 1024) {
        console.warn('Backup data is very large:', dataString.length, 'bytes');
      }
      
      if (typeof process !== 'undefined' && process.env.KV) {
        const kv = (process.env as any).KV;
        await kv.put(key, dataString, {
          metadata: {
            marketId: input.marketId,
            userId: input.userId,
            timestamp: input.timestamp,
            debtorCount: input.debtors.length,
          }
        });
        console.log(`Backup saved to KV storage with key: ${key}`);
      } else {
        console.log("KV storage not available, using in-memory storage");
        if (typeof globalThis !== 'undefined') {
          (globalThis as any).__backupStorage = (globalThis as any).__backupStorage || {};
          (globalThis as any).__backupStorage[key] = dataString;
          console.log(`Backup saved to memory storage with key: ${key}`);
        } else {
          throw new Error('No storage available');
        }
      }
      
      return { 
        success: true as const, 
        message: "✅ هاوکاتکردنی Cloud سەرکەوتوو بوو",
        timestamp: input.timestamp,
        key: key,
        debtorCount: input.debtors.length,
        size: dataString.length,
      };
    } catch (error) {
      console.error("❌ Error saving backup:", error);
      const errorMessage = error instanceof Error ? error.message : String(error || "Failed to save backup");
      
      let userFriendlyMessage = '❌ هەڵەیەک ڕوویدا لە پاشەکەوتکردن';
      if (errorMessage.includes('Invalid input')) {
        userFriendlyMessage = '⚠️ زانیاریەکان تەواو نین';
      } else if (errorMessage.includes('No storage available')) {
        userFriendlyMessage = '📡 خزمەتگوزاریەکەی Cloud بەردەست نییە';
      } else if (errorMessage.includes('too large')) {
        userFriendlyMessage = '⚠️ قەبارەی زانیاریەکان زۆر گەورەیە';
      }
      
      return {
        success: false as const,
        message: userFriendlyMessage,
        error: errorMessage,
      };
    }
  });
