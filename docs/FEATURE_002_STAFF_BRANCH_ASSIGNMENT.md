# Feature Request: Staff Branch Assignment

**Feature ID:** F-002  
**Status:** 🔄 In Progress  
**Priority:** High  
**Tanggal:** 2026-07-12

## Problem Statement

Saat ini staff tidak di-assign ke cabang spesifik. Ini bermasalah karena:
- Staff bisa lihat data semua cabang (seharusnya hanya cabang mereka)
- Tidak ada kontrol akses per-branch
- Owner tidak bisa assign staff ke cabang tertentu saat create

## Solution Design

### 1. UI Changes

**Form Create Staff** (/app/staff)
- Tambah dropdown "Cabang" (wajib untuk non-owner role)
- Owner tidak perlu pilih cabang (akses semua cabang)

**Staff List**
- Tampilkan kolom "Cabang" di tabel staff
- Badge untuk owner: "Semua Cabang"

### 2. Backend Logic

**Staff Service**
- Update createWithAuth() untuk include ranch_id
- Validation: non-owner role must have ranch_id

### 3. Data Access Control

**useTenant Hook**
- Return ranchId dari 	enantUser.branch_id
- Owner → ranchId = null (akses semua)
- Staff → ranchId = specific branch

**Query Filters**
- Stock: Filter by ranch_id jika staff
- Transactions: Filter by ranch_id jika staff
- Reports: Scope to branch jika staff

### 4. Permission Matrix Update

| Role | Branch Access |
|------|---------------|
| Owner | All branches (branch_id = NULL) |
| Manager | Assigned branch only |
| Kasir | Assigned branch only |
| Warehouse | Assigned branch only |

## Implementation Steps

1. ✅ Update staff.tsx - Add branch dropdown to form
2. ✅ Update staff.service.ts - Include branch_id in create
3. ✅ Update useTenant hook - Return branchId
4. ✅ Update stock queries - Filter by branch for staff
5. ⏳ Update other queries (transactions, reports) - Filter by branch
6. ✅ Update RLS policies if needed
7. ✅ Testing & documentation

## Files to Modify

- src/routes/app/staff.tsx - Form UI
- src/services/staff.service.ts - Create logic
- src/hooks/use-tenant.ts - Add branchId
- src/hooks/use-stock.ts - Filter by branch
- src/services/stock.service.ts - Query filter
- docs/ROLES_AND_PERMISSIONS.md - Update matrix

## Testing Checklist

- [ ] Owner create staff → dropdown branch muncul
- [ ] Owner create owner role → dropdown branch disabled/hidden
- [ ] Staff login → hanya lihat data cabang mereka
- [ ] Owner login → lihat semua cabang
- [ ] Stock page → staff hanya lihat stock cabang mereka
- [ ] POS → staff hanya bisa transaksi di cabang mereka

---

**Next:** Implementasi step by step
