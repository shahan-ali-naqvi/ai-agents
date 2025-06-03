import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { getFirebaseUser } from "@/lib/auth-helpers";

// GET - List all ports for the authenticated user
export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user
    const user = await getFirebaseUser(req);
    
    if (!user?.uid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user.uid;

    // Get all ports for the user from Firestore
    const portsSnapshot = await db
      .collection('ports')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const ports = portsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ ports });
  } catch (error) {
    console.error("Error fetching ports:", error);
    return NextResponse.json(
      { error: "Failed to fetch ports" },
      { status: 500 }
    );
  }
}

// POST - Create a new port for the authenticated user
export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const user = await getFirebaseUser(req);
    
    if (!user?.uid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user.uid;
    
    // Get request body
    const { name, portNumber, protocol, host, description } = await req.json();
    
    // Validate input
    if (!name || !portNumber) {
      return NextResponse.json(
        { error: "Name and port number are required" },
        { status: 400 }
      );
    }

    // Check if port number is valid
    if (portNumber < 1 || portNumber > 65535) {
      return NextResponse.json(
        { error: "Port number must be between 1 and 65535" },
        { status: 400 }
      );
    }

    // Create the port in Firestore
    const portData = {
      name,
      portNumber,
      protocol: protocol || "http",
      host: host || "localhost",
      description,
      userId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const portRef = await db.collection('ports').add(portData);
    const port = { id: portRef.id, ...portData };

    return NextResponse.json({ port }, { status: 201 });
  } catch (error) {
    console.error("Error creating port:", error);
    return NextResponse.json(
      { error: "Failed to create port" },
      { status: 500 }
    );
  }
} 