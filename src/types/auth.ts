export type AuthenticatedUser = {
  id: string;
  role: string;
  permissions: string[];
  branchId?: string;
};
