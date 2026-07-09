import type { NextRequest } from "next/server";

import {
  getProfileController,
  updateProfileController,
} from "@/controllers/user-controller";
import { requireAuth } from "@/lib/auth/auth";

export const GET = requireAuth(async (req) => getProfileController(req.user!));

export const PATCH = requireAuth(async (req: NextRequest) =>
  updateProfileController(req, req.user!),
);
