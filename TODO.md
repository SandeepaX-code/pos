# TODO - Phase 3: User Management Module

## Plan

- [ ] Create production-ready REST API routes under `/api/users`, `/api/roles`, `/api/permissions`
- [ ] Extend Mongoose models (User/Role/Permission) to match requested fields without duplicating models
- [ ] Implement repository layer (users, roles, permissions) using Mongoose
- [ ] Implement service layer with business rules (RBAC, system-role protections, audit logging)
- [ ] Add Zod validators for all request bodies/query params
- [ ] Implement activity logs for user-related actions
- [ ] Implement avatar upload using Next.js route handlers + local storage abstraction
- [ ] Generate OpenAPI/Swagger docs for all endpoints
- [ ] Add unit tests for services/middleware
- [ ] Run `npm test` and `scripts/check-endpoints.ts`
