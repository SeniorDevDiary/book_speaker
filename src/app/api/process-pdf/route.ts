import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parsing to handle FormData
  },
};

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");

  if (!file) {
    return NextResponse.json(
      { success: false, message: "No file uploaded" },
      { status: 400 }
    );
  }

  try {
    const arrayBuffer = await (file as any)?.arrayBuffer();
    const pdfData = await pdf(Buffer.from(arrayBuffer));
    const text = pdfData.text;
    const segments = splitTextIntoSegments(text, 500);

    const jsonFiles = segments.map((segment, index) => ({
      filename: `segment-${index + 1}.json`,
      content: JSON.stringify({ content: segment }, null, 2),
    }));

    return NextResponse.json({ success: true, files: jsonFiles });
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      { success: false, message: "Error processing PDF." },
      { status: 500 }
    );
  }
}

const splitTextIntoSegments = (text: string, segmentLength: number) => {
  const words = text.split(/\s+/);
  const segments = [];

  for (let i = 0; i < words.length; i += segmentLength) {
    segments.push(words.slice(i, i + segmentLength).join(" "));
  }

  return segments;
};
