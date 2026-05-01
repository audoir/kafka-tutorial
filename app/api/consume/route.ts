import { createConsumer } from "@/lib/kafka";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let c: ReturnType<typeof createConsumer> | null = null;
  try {
    const { topic, groupId = "kafka-tutorial-group", maxMessages = 20 } =
      await request.json();

    if (!topic) {
      return Response.json({ error: "topic is required" }, { status: 400 });
    }

    c = createConsumer(groupId);
    await c.connect();
    // fromBeginning only applies when the consumer group has no committed offsets yet.
    // Once offsets are committed, Kafka always resumes from the last committed offset.
    await c.subscribe({ topic, fromBeginning: true });

    const messages: Array<{
      partition: number;
      offset: string;
      key: string | null;
      value: string | null;
      timestamp: string;
    }> = [];

    let done = false;

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        if (!done) { done = true; resolve(); }
      }, 4000);

      c!.run({
        autoCommit: true,
        eachMessage: async ({ partition, message }) => {
          messages.push({
            partition,
            offset: message.offset,
            key: message.key ? message.key.toString() : null,
            value: message.value ? message.value.toString() : null,
            timestamp: message.timestamp,
          });

          if (messages.length >= maxMessages) {
            clearTimeout(timeout);
            if (!done) { done = true; resolve(); }
          }
        },
      }).catch(() => {
        clearTimeout(timeout);
        if (!done) { done = true; resolve(); }
      });
    });

    // Brief pause to let any in-flight commits complete before disconnecting
    await new Promise((r) => setTimeout(r, 200));
    await c.disconnect();

    return Response.json({ success: true, messages });
  } catch (error: unknown) {
    if (c) { try { await c.disconnect(); } catch { /* ignore */ } }
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
