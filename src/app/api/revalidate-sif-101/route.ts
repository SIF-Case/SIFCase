import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    // Revalidate the SIF-101 hub page
    revalidatePath("/sif-101");
    
    return NextResponse.json({ 
      ok: true, 
      message: "SIF-101 page revalidated successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error revalidating SIF-101:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to revalidate" 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
