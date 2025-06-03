import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { auth } from "firebase-admin";
import { db } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    
    // Validate input
    if (!email || !email.includes('@') || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      );
    }

    // Check if user already exists in Firebase
    try {
      const userRecord = await auth().getUserByEmail(email);
      if (userRecord) {
        return NextResponse.json(
          { error: "User already exists" },
          { status: 409 }
        );
      }
    } catch (error: any) {
      // If error code is auth/user-not-found, that's good - we continue
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Hash password for our own records (Firebase will handle its own hashing)
    const hashedPassword = await hash(password, 10);

    // Create user in Firebase Auth
    const userRecord = await auth().createUser({
      email,
      password,
      displayName: name,
    });

    // Store additional user data in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      name,
      email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        user: {
          id: userRecord.uid,
          name: userRecord.displayName,
          email: userRecord.email
        }, 
        message: "User created successfully" 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
} 