import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

// GET /api/users - List all users (superadmin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await db.query.user.findMany({
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/users - Create user (superadmin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["superadmin", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if email already exists
    const existing = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const inserted = await db
      .insert(user)
      .values({
        id: userId,
        email,
        password: hashedPassword,
        name,
        role,
      })
      .returning();

    const newUser = inserted[0];
    return NextResponse.json({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      createdAt: newUser.createdAt,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
