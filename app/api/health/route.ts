import { admin } from "@/lib/kafka";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await admin.connect();
    const cluster = await admin.describeCluster();
    await admin.disconnect();

    return Response.json({
      connected: true,
      brokers: cluster.brokers.map((b) => ({
        nodeId: b.nodeId,
        host: b.host,
        port: b.port,
      })),
      controllerId: cluster.controller,
      clusterId: cluster.clusterId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ connected: false, error: message }, { status: 503 });
  }
}
