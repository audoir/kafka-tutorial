import { admin } from "@/lib/kafka";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await admin.connect();
    const groups = await admin.listGroups();
    await admin.disconnect();

    return Response.json({ groups: groups.groups });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
