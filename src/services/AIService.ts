// Client for the backend AI analyst (blocra-backend /api/ai/*).
import { apiClient } from "@/lib/api";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AIStatus {
  enabled: boolean;
  model: string | null;
}

export const AIService = {
  status(): Promise<AIStatus> {
    return apiClient.request<AIStatus>("/ai/status");
  },

  async chat(messages: ChatTurn[], context?: unknown): Promise<string> {
    const res = await apiClient.request<{ reply: string }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ messages, context }),
    });
    return res.reply;
  },

  async report(input: {
    contractName: string;
    contractAddress: string;
    chain: string;
    stats: unknown;
  }): Promise<{ report: string; model: string }> {
    return apiClient.request("/ai/report", {
      method: "POST",
      body: JSON.stringify({
        contract_name: input.contractName,
        contract_address: input.contractAddress,
        chain: input.chain,
        stats: input.stats,
      }),
    });
  },

  async sql(question: string): Promise<string> {
    const res = await apiClient.request<{ sql: string }>("/ai/sql", {
      method: "POST",
      body: JSON.stringify({ question }),
    });
    return res.sql;
  },
};
