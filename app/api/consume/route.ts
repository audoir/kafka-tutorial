import { createConsumer } from "@/lib/kafka";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { topic, groupId = "kafka-tutorial-group", fromBeginning = false, maxMessages = 20 } =
      await request.json();

    if (!topic) {
      return Response.json({ error: "topic is required" }, { status: 400 });
    }

    const consumer = createConsumer(groupId);
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning });

    const messages: Array<{
      partition: number;
      offset: string;
      key: string | null;
      value: string | null;
      timestamp: string;
    }> = [];

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve();
      }, 3000);

      consumer.run({
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
            resolve();
          }
        },
      }).catch((err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    await consumer.disconnect();

    return Response.json({ success: true, messages });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
