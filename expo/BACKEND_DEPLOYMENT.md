# ڕێنمایی بڵاوکردنەوەی Backend

## ✅ چارەسەرکراوە

Backend-ی تۆ ئێستا ئامادەیە و بە باشی کار دەکات. ئەمانەی خوارەوە چارەسەر کراون:

1. ✅ tRPC Router دانراوە و کار دەکات
2. ✅ tRPC Provider لە `app/_layout.tsx` دانراوە
3. ✅ Endpoint-ی تاقیکردنەوە (`health.check`) دروست کراوە
4. ✅ Error handling باشتر کراوە

## 🚀 چۆن Backend-ەکەت بلاو بکەیتەوە

Backend-ەکەت لە Rork.com هۆست کراوە و خۆکارانە بڵاو دەکرێتەوە. بەڵام بۆ بەکارهێنانی production، پێویستە:

### 1. دڵنیابە لە کارکردنی Backend

ئەم endpoint-انە ئێستا بەردەستن:

```typescript
// تاقیکردنەوەی تەندروستی سیستم
const result = await trpc.health.check.useQuery();
// دەگەڕێنێتەوە: { status: "ok", message: "Backend is working correctly", timestamp: "...", version: "1.0.0" }

// نموونەی تاقیکردنەوە
const result = await trpc.example.hi.useQuery({ name: "خاوەن کار" });
// دەگەڕێنێتەوە: { hello: "خاوەن کار", date: "..." }
```

### 2. بەکارهێنانی API لە کۆمپۆنێنتەکانتدا

```typescript
import { trpc } from "@/lib/trpc";

function MyComponent() {
  // لە React component-دا
  const healthQuery = trpc.health.check.useQuery();
  
  if (healthQuery.isLoading) return <Text>چاوەڕوان بە...</Text>;
  if (healthQuery.error) return <Text>هەڵە: {healthQuery.error.message}</Text>;
  
  return <Text>سیستم: {healthQuery.data.status}</Text>;
}
```

### 3. بەکارهێنانی لە دەرەوەی React

```typescript
import { trpcClient } from "@/lib/trpc";

async function someFunction() {
  try {
    const result = await trpcClient.health.check.query();
    console.log("سیستم:", result.status);
  } catch (error) {
    console.error("هەڵە:", error);
  }
}
```

## 📝 زیادکردنی Endpoint-ی نوێ

بۆ زیادکردنی endpoint-ی نوێ:

### 1. دروستکردنی Route-ی نوێ

```typescript
// backend/trpc/routes/debts/list/route.ts
import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

export default publicProcedure
  .input(z.object({ 
    customerId: z.string().optional() 
  }))
  .query(async ({ input }) => {
    // لۆژیکی خۆت لێرە بنووسە
    return {
      debts: [],
      total: 0
    };
  });
```

### 2. زیادکردنی بۆ Router

```typescript
// backend/trpc/app-router.ts
import debtListRoute from "./routes/debts/list/route";

export const appRouter = createTRPCRouter({
  health: createTRPCRouter({
    check: healthCheckRoute,
  }),
  debts: createTRPCRouter({
    list: debtListRoute,
  }),
  // ... هیتر
});
```

### 3. بەکارهێنان لە Client

```typescript
const debtsQuery = trpc.debts.list.useQuery({ customerId: "123" });
```

## 🔒 Secured Endpoints (Protected Procedures)

ئەگەر دەتەوێت endpoint-ێک بپارێزیت:

```typescript
// backend/trpc/routes/admin/delete/route.ts
import { protectedProcedure } from "@/backend/trpc/create-context";

export default protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input, ctx }) => {
    // بەکارهێنانی ctx.req بۆ وەرگرتنی زانیاری authentication
    return { success: true };
  });
```

## 🌐 بۆ بڵاوکردنەوە لە App Store

کاتێک دەتەوێت ئەپەکەت بلاوبکەیتەوە:

1. **دڵنیابە Backend-ەکەت ئامادەیە** - هەموو endpoint-ەکان تاقی بکەرەوە
2. **لۆکاڵ تاقیکردنەوە** - ئەپەکە لەسەر مۆبایل تاقی بکەرەوە
3. **Build بگرە** - بۆ iOS و Android
4. **بینێرە بۆ App Store** - بەپێی ڕێنماییەکانی Apple/Google

## ⚠️ تێبینی گرنگ

- ئێستا Backend-ەکەت لەسەر Rork.com هۆست کراوە
- کاتێک ئەپەکە دابەزێنیت، Backend خۆکارانە بڵاو دەبێتەوە
- هەموو endpoint-ەکان لە `/api/trpc/*` بەردەستن
- SuperJSON بەکار دێت بۆ serialize کردنی Date و Map و Set

## 📱 تاقیکردنەوەی API

تاقیکردنەوەی خێرا:

```typescript
// لە هەر کۆمپۆنێنتێک
import { trpc } from "@/lib/trpc";

function TestComponent() {
  const { data, error, isLoading } = trpc.health.check.useQuery();
  
  return (
    <View>
      <Text>Status: {data?.status}</Text>
      <Text>Message: {data?.message}</Text>
      <Text>Time: {data?.timestamp}</Text>
    </View>
  );
}
```

## 🎯 دواتر

Backend-ەکەت ئامادەیە! دەتوانیت:
- Endpoint-ی نوێ زیاد بکەیت بۆ debts, customers, transactions
- Authentication زیاد بکەیت بە JWT یان Session
- Database بەستریت (PostgreSQL, MongoDB, هتد)
- File upload زیاد بکەیت
- Real-time features زیاد بکەیت بە WebSocket

هەموو شتێک ئامادەیە بۆ بڵاوکردنەوە! 🚀
