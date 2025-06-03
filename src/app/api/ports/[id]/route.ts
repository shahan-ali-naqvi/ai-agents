import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { getFirebaseUser } from "@/lib/auth-helpers";

// Define port interface
interface Port {
  id: string;
  name: string;
  portNumber: number;
  protocol: string;
  host: string;
  description?: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// GET - Get a specific port by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Get the authenticated user
    const user = await getFirebaseUser(req);
    
    if (!user?.uid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user.uid;

    // Find the port in Firestore
    const portDoc = await db.collection('ports').doc(id).get();

    // Check if port exists and belongs to the user
    if (!portDoc.exists) {
      return NextResponse.json(
        { error: "Port not found" },
        { status: 404 }
      );
    }

    const port = { id: portDoc.id, ...portDoc.data() } as Port;

    if (port.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({ port });
  } catch (error) {
    console.error("Error fetching port:", error);
    return NextResponse.json(
      { error: "Failed to fetch port" },
      { status: 500 }
    );
  }
}

// PUT - Update a specific port
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Get the authenticated user
    const user = await getFirebaseUser(req);
    
    if (!user?.uid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user.uid;

    // Check if port exists and belongs to the user
    const portDoc = await db.collection('ports').doc(id).get();

    // Check if port exists
    if (!portDoc.exists) {
      return NextResponse.json(
        { error: "Port not found" },
        { status: 404 }
      );
    }

    const existingPort = { id: portDoc.id, ...portDoc.data() } as Port;

    // Check if port belongs to the user
    if (existingPort.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get request body
    const { name, portNumber, protocol, host, description, isActive } = await req.json();
    
    // Validate port number if provided
    if (portNumber && (portNumber < 1 || portNumber > 65535)) {
      return NextResponse.json(
        { error: "Port number must be between 1 and 65535" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Partial<Port> = {
      updatedAt: new Date().toISOString()
    };

    // Only include fields that are provided
    if (name !== undefined) updateData.name = name;
    if (portNumber !== undefined) updateData.portNumber = portNumber;
    if (protocol !== undefined) updateData.protocol = protocol;
    if (host !== undefined) updateData.host = host;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update the port in Firestore
    await db.collection('ports').doc(id).update(updateData);

    // Get the updated port
    const updatedPortDoc = await db.collection('ports').doc(id).get();
    const updatedPort = { id: updatedPortDoc.id, ...updatedPortDoc.data() } as Port;

    return NextResponse.json({ port: updatedPort });
  } catch (error) {
    console.error("Error updating port:", error);
    return NextResponse.json(
      { error: "Failed to update port" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific port
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Get the authenticated user
    const user = await getFirebaseUser(req);
    
    if (!user?.uid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user.uid;

    // Check if port exists and belongs to the user
    const portDoc = await db.collection('ports').doc(id).get();

    // Check if port exists
    if (!portDoc.exists) {
      return NextResponse.json(
        { error: "Port not found" },
        { status: 404 }
      );
    }

    const existingPort = { id: portDoc.id, ...portDoc.data() } as Port;

    // Check if port belongs to the user
    if (existingPort.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Delete the port from Firestore
    await db.collection('ports').doc(id).delete();

    return NextResponse.json(
      { message: "Port deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting port:", error);
    return NextResponse.json(
      { error: "Failed to delete port" },
      { status: 500 }
    );
  }
} 