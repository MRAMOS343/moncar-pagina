

## Plan: Responsive improvements + Vehicle document download fix on mobile

### Problem 1: Vehicle document download on mobile

The `handleDownload` in `VehicleDetailModal.tsx` (line 63) uses `window.open(url, '_blank')` to open the download URL. On mobile browsers (especially Safari/iOS), `window.open` is frequently blocked by popup blockers, or the new tab behavior is unreliable. This is the likely cause of the download not working on phones.

**Fix**: Replace `window.open` with the same anchor-element download pattern used in `salesReportService.ts` — create an `<a>` element, set `href` and `download`, click it programmatically, then remove it.

**File**: `src/components/vehiculos/VehicleDetailModal.tsx`
- Change `handleDownload` to fetch the URL, then create an anchor element with `download` attribute to trigger the download instead of `window.open`.

### Problem 2: Responsiveness improvements across the app

After reviewing the codebase, here are the key areas needing mobile improvements:

#### A. `AppTopbar.tsx` — Search bar and warehouse selector overflow on small screens
- The search input is a fixed `w-80` that overflows on mobile
- The warehouse selector `w-40` is too wide on small screens
- The role simulator should be hidden on mobile (it's dev-only anyway)
- **Fix**: Hide search on mobile (or make it collapsible), make warehouse selector responsive, reduce gaps

#### B. `ModuleSelectorPage.tsx` — Header overflows on mobile
- Header has horizontal layout that doesn't wrap on small screens
- User info and logout button overlap
- **Fix**: Stack header elements vertically on mobile, reduce padding

#### C. `VehicleDetailModal.tsx` — Document table not readable on mobile
- Full table with 5 columns crammed into a small modal
- **Fix**: On mobile, render documents as stacked cards instead of a table

#### D. `VehiclesPage.tsx` — `UnidadCollapsible` text truncation
- Unit info (`placa · marca modelo`) doesn't wrap and overflows
- **Fix**: Wrap text, stack info vertically on mobile

#### E. `RutaCollapsible.tsx` — Action menu touch target
- The `MoreHorizontal` button is only `h-8 w-8`, below 44px touch target minimum
- **Fix**: Increase to touch-friendly size on mobile

#### F. `DashboardPage.tsx` — Charts and KPIs
- Already uses `grid-cols-1 md:grid-cols-3` for KPIs which is good
- Charts may overflow on very small screens

### Implementation order

1. Fix vehicle document download for mobile (anchor element pattern)
2. Make `AppTopbar` responsive (hide search on mobile, responsive warehouse selector)
3. Make `ModuleSelectorPage` header responsive
4. Make `VehicleDetailModal` documents section responsive (cards on mobile)
5. Make `UnidadCollapsible` responsive (stack info on mobile)
6. Increase touch targets on `RutaCollapsible`

### Files to modify
- `src/components/vehiculos/VehicleDetailModal.tsx` — download fix + responsive docs
- `src/components/layout/AppTopbar.tsx` — responsive topbar
- `src/pages/ModuleSelectorPage.tsx` — responsive header
- `src/components/vehiculos/UnidadCollapsible.tsx` — responsive unit info
- `src/components/vehiculos/RutaCollapsible.tsx` — touch targets

