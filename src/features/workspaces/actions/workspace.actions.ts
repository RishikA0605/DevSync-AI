"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createWorkspaceSchema, CreateWorkspaceValues } from "@/validations/workspace.schema";
import { revalidatePath } from "next/cache";

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

export async function createWorkspace(data: CreateWorkspaceValues) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const parsed = createWorkspaceSchema.parse(data);
  const baseSlug = slugify(parsed.name);
  let slug = baseSlug;
  
  // Ensure unique slug
  let counter = 1;
  while (await prisma.workspace.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  try {
    const workspace = await prisma.workspace.create({
      data: {
        name: parsed.name,
        slug,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    });

    revalidatePath("/dashboard");
    return { success: true, workspace };
  } catch (error: any) {
    console.error("Create Workspace Error:", error);
    return { success: false, error: error.message || "Failed to create workspace in database." };
  }
}

import { cache } from "react";

export const getUserWorkspaces = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await prisma.workspace.findMany({
    where: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
});
