import { Redis } from "@upstash/redis";
import CryptoJS from "crypto-js";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const MOCK_PATH = path.join(process.cwd(), "vault", "redis_mock.json");

export interface ConcryptOrder {
  orderId: string;
  job: {
    description: string;
    budget: string;
    provider: string;
    evaluator: string;
    expiry: number;
  };
  strategy: {
    caseType: string;
    requiredSkills: string[];
    rubric: string;
  };
  onChainJobId?: string;
  status: "CREATED" | "FUNDED" | "SETTLED";
  createdAt: number;
}

/**
 * REDIS SERVICE (With Mock Fallback)
 * High-integrity storage for Concrypt Smart Orders.
 */
export class RedisService {
  private static redis?: Redis;

  static init() {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      console.log("[REDIS] Using Upstash Cloud Storage.");
    } else {
      console.warn("[REDIS] Credentials missing. Using Local File-Based Mock.");
      if (!fs.existsSync(path.dirname(MOCK_PATH))) fs.mkdirSync(path.dirname(MOCK_PATH), { recursive: true });
      if (!fs.existsSync(MOCK_PATH)) fs.writeFileSync(MOCK_PATH, JSON.stringify({}));
    }
  }

  static async setMock(key: string, value: any) {
    const data = JSON.parse(fs.readFileSync(MOCK_PATH, "utf8"));
    data[key] = value;
    fs.writeFileSync(MOCK_PATH, JSON.stringify(data, null, 2));
  }

  static async getMock<T>(key: string): Promise<T | null> {
    const data = JSON.parse(fs.readFileSync(MOCK_PATH, "utf8"));
    return data[key] || null;
  }

  static generateOrderHash(job: any): string {
    const payload = `${job.description}-${job.budget}-${job.provider}-${job.evaluator}-${job.expiry}`;
    return CryptoJS.SHA256(payload).toString().substring(0, 16);
  }

  static async saveOrder(order: Omit<ConcryptOrder, "orderId" | "status" | "createdAt">): Promise<string> {
    if (!this.redis) this.init();
    const orderId = this.generateOrderHash(order.job);
    const newOrder: ConcryptOrder = { ...order, orderId, status: "CREATED", createdAt: Date.now() };

    if (this.redis) {
      await this.redis.set(`order:${orderId}`, newOrder);
    } else {
      await this.setMock(`order:${orderId}`, newOrder);
    }

    console.log(`[REDIS] Order ${orderId} saved.`);
    return orderId;
  }

  static async getOrder(orderId: string): Promise<ConcryptOrder | null> {
    if (!this.redis) this.init();
    if (this.redis) return await this.redis.get<ConcryptOrder>(`order:${orderId}`);
    return await this.getMock<ConcryptOrder>(`order:${orderId}`);
  }

  static async linkJob(orderId: string, jobId: bigint) {
    if (!this.redis) this.init();
    const order = await this.getOrder(orderId);
    if (order) {
      order.onChainJobId = jobId.toString();
      if (this.redis) {
        await this.redis.set(`order:${orderId}`, order);
        await this.redis.set(`job:${jobId.toString()}`, orderId);
      } else {
        await this.setMock(`order:${orderId}`, order);
        await this.setMock(`job:${jobId.toString()}`, orderId);
      }
      console.log(`[REDIS] Linked Order ${orderId} to Job ${jobId}`);
    }
  }

  static async getOrderByJobId(jobId: bigint): Promise<ConcryptOrder | null> {
    if (!this.redis) this.init();
    let orderId: string | null;
    if (this.redis) {
      orderId = await this.redis.get<string>(`job:${jobId.toString()}`);
    } else {
      orderId = await this.getMock<string>(`job:${jobId.toString()}`);
    }
    if (!orderId) return null;
    return await this.getOrder(orderId);
  }
}
