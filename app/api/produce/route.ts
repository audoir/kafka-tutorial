import { producer } from "@/lib/kafka";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { topic, messages } = await request.json();

    if (!topic || !messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "topic and messages array are required" },
        { status: 400 }
      );
    }

    await producer.connect();

    const result = await producer.send({
      topic,
      messages: messages.map(
        (m: { key?: string; value: string }) => ({
          key: m.key ?? null,
          value: m.value,
        })
      ),
    });

    await producer.disconnect();

    return Response.json({ success: true, result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
