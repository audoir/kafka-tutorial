import { Kafka, logLevel } from "kafkajs";

const kafka = new Kafka({
  clientId: "kafka-tutorial",
  brokers: ["localhost:9092"],
  logLevel: logLevel.ERROR,
});

export const admin = kafka.admin();
export const producer = kafka.producer();

export function createConsumer(groupId: string) {
  return kafka.consumer({ groupId });
}

export default kafka;
