import { PrismaClient } from "@prisma/client";

// One client per process (Next dev hot-reload creates modules repeatedly).
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
