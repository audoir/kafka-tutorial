import { admin } from "@/lib/kafka";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await admin.connect();
    const topics = await admin.listTopics();
    const metadata = await admin.fetchTopicMetadata({ topics });
    await admin.disconnect();

    const topicDetails = metadata.topics.map((t) => ({
      name: t.name,
      partitions: t.partitions.map((p) => ({
        partitionId: p.partitionId,
        leader: p.leader,
        replicas: p.replicas,
        isr: p.isr,
      })),
    }));

    return Response.json({ topics: topicDetails });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { topic, numPartitions = 1, replicationFactor = 1 } = await request.json();

    if (!topic) {
      return Response.json({ error: "Topic name is required" }, { status: 400 });
    }

    await admin.connect();
    await admin.createTopics({
      topics: [{ topic, numPartitions, replicationFactor }],
    });
    await admin.disconnect();

    return Response.json({ success: true, topic });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { topic } = await request.json();

    if (!topic) {
      return Response.json({ error: "Topic name is required" }, { status: 400 });
    }

    await admin.connect();
    await admin.deleteTopics({ topics: [topic] });
    await admin.disconnect();

    return Response.json({ success: true, topic });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
