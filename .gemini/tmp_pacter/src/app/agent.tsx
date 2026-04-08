
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import {streamRunnableUI, exposeEndpoints} from "@/ai/server";
import nodegraph from "@/ai/graph";

const convertChatHistoryToMessages = (
  chat_history: [role: string, content: string][],
) => {
  return chat_history.map(([role, content]) => {
    switch (role) {
      case "human":
        return new HumanMessage(content);
      case "assistant":
      case "ai":
        return new AIMessage(content);
      default:
        return new HumanMessage(content);
    }
  });
};
  
  async function agent(inputs: {
  chat_history: [role: string, content: string][],
  input: string;
  walletAddress?: string | null;
}) {
  "use server"; 

  const result = await streamRunnableUI({
    input: inputs.input,
    chat_history: convertChatHistoryToMessages(inputs.chat_history),
    walletAddress: inputs.walletAddress
  });

  // Filter out JSON data markers from response content
  let cleanedResponseContent = result.responseContent;
  if (cleanedResponseContent) {
    // Remove JSON data blocks that are meant for backend processing only
    cleanedResponseContent = cleanedResponseContent.replace(/\[JSON_DATA_START\][\s\S]*?\[JSON_DATA_END\]/g, '').trim();
  }

  // Return both UI and state information
  return {
    ui: result.ui,
    responseContent: cleanedResponseContent,
    graphState: result.graphState
  };
}
  
  export const EndpointsContext = exposeEndpoints({ agent });