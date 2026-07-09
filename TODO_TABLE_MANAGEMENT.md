# TODO - Table Management & Reservation Module (MongoDB)

## Step 1: Repo audit & alignment

- [x] Inspect existing tables API + repository stack
- [x] Inspect existing Mongoose models for RestaurantTable, Reservation, ActivityLog
- [x] Inspect RBAC/auth helpers + response helpers
- [ ] Align/extend Mongoose schemas to match required spec fields & enums

## Step 2: Create Clean Architecture foundation

- [ ] Add Zod schemas for all Table/Reservation operations (filters, CRUD, status transitions, transfer/merge/split, reservation overlaps)
- [ ] Add repository interfaces + Mongoose implementations:
  - [ ] TableRepository (query/list with pagination/search/filter/sort; unique tableNumber)
  - [ ] ReservationRepository (overlap checks; auto-assign)
  - [ ] ActivityLogRepository (write logs)
  - [ ] Reservation + Table layout repository (TableLayout)
- [ ] Add service layer:
  - [ ] TableService (status transitions, CRUD, transfer/merge/split with transactions)
  - [ ] ReservationService (CRUD + checkin/cancel/complete with conflict prevention)

## Step 3: API routes (Next.js 15)

- [ ] Migrate/replace `/api/tables`:
  - [ ] GET with pagination/search/filter/sort
  - [ ] POST create
  - [ ] GET/PUT/DELETE `/api/tables/:id`
- [ ] Add status endpoints:
  - [ ] PATCH `/api/tables/:id/open`
  - [ ] PATCH `/api/tables/:id/occupy`
  - [ ] PATCH `/api/tables/:id/reserve`
  - [ ] PATCH `/api/tables/:id/clean`
  - [ ] PATCH `/api/tables/:id/close`
- [ ] Add transfer endpoint:
  - [ ] POST `/api/tables/transfer` (transaction)
- [ ] Add merge endpoint:
  - [ ] POST `/api/tables/merge` (transaction)
- [ ] Add split endpoint:
  - [ ] POST `/api/tables/split` (transaction)

## Step 4: Reservation endpoints

- [ ] Migrate/replace `/api/reservations`:
  - [ ] GET, POST, PUT, DELETE
  - [ ] PATCH `/api/reservations/:id/checkin`
  - [ ] PATCH `/api/reservations/:id/cancel`
  - [ ] PATCH `/api/reservations/:id/complete`
- [ ] Enforce business rules:
  - [ ] prevent double booking
  - [ ] overlap checks
  - [ ] auto-assign available tables

## Step 5: Table layout + dashboard

- [ ] Add TableLayout model + layout endpoints for drag/drop updates
- [ ] Implement dashboard:
  - [ ] GET `/api/dashboard/table-summary`

## Step 6: Activity logs

- [ ] Ensure every action writes ActivityLog:
  - [ ] Create/Update/Delete Table
  - [ ] Transfer/Merge/Split
  - [ ] Reserve/Open/Close/Clean as applicable
  - [ ] Reservation check-in/cancel/complete

## Step 7: Permissions

- [ ] Wire RBAC checks per endpoint:
  - [ ] Super Admin/Admin: Create/Delete tables, Merge/Split/Transfer
  - [ ] Waiter: View/Open/Reserve/Transfer
  - [ ] Cashier: Close/Merge/Split
  - [ ] Kitchen: Read only

## Step 8: Tests & validation

- [ ] Typecheck + lint
- [ ] Run endpoint script (check-endpoints)
- [ ] Seed basic data and verify:
  - [ ] unique tableNumber
  - [ ] invalid transitions blocked
  - [ ] overlap/double booking blocked
  - [ ] merge/split/transfer transactions consistent
