import { createStreamableUI } from 'ai/rsc';
import nodegraph from './graph';
import { AIMessageText, HumanMessageText } from "@/components/ui/message";
import { ReactNode } from 'react';
import { AIProvider } from './client';
import { BaseMessage } from '@langchain/core/messages';
import { Runnable } from '@langchain/core/runnables';
import { SmartContractDisplay } from '@/components/ui/ContractUI';

export async function streamRunnableUI({ chat_history, input, walletAddress }: { chat_history?: BaseMessage[], input: string, walletAddress?: string | null }) {
  const graph = nodegraph();
  const stream = await graph.stream({ 
    input,
    chatHistory: chat_history, // Use chatHistory to match graph state property
    walletAddress,
  },{
    streamMode:"updates",
  },);

  const ui = createStreamableUI();
  let aiResponseContent = "";
  let graphState: any = {}; // Track the complete graph state

  for await (const value of stream) {
    
    
    for (const [nodeName, values] of Object.entries(value)) {
     
      // Update graph state with all values from the current node
      // Only spread if values is an object
      if (values && typeof values === 'object' && !Array.isArray(values)) {
        graphState = { ...graphState, ...values };
      }
    
      console.log(`Node: ${nodeName}, State Update:`, {
        stage: (values as any)?.stage,
        progress: (values as any)?.progress,
        stageIndex: (values as any)?.stageIndex,
        currentFlowStage: (values as any)?.currentFlowStage,
        isStageComplete: (values as any)?.isStageComplete,
        collectedFields: (values as any)?.collectedFields
      });
    
   // Add a loading indicator when the stream starts
    if (nodeName === 'initial_node') {
      ui.append(<div className="animate-pulse bg-gray-300 rounded-md p-2 w-24 h-6"></div>);
    }
if (nodeName !== 'end') {
      // Capture AI response content from either result or messages
      if ((values as { result?: string }).result) {
        aiResponseContent = (values as { result: string }).result;
        ui.update(<AIMessageText content={aiResponseContent} />);
      } else if ((values as { messages?: any[] }).messages && (values as { messages: any[] }).messages.length > 0) {
        // Get the last message as the AI response content and convert to string
        const messages = (values as { messages: any[] }).messages;
        const lastMessage = messages[messages.length - 1];
        aiResponseContent = typeof lastMessage === 'string' ? lastMessage : String(lastMessage);
        ui.update(<AIMessageText content={aiResponseContent} />);
      }
   
      // Handle final data display when information collection is complete
      if (nodeName === 'request_missing_info' && (values as any).finalData) {
        console.log('Final project data:', (values as any).finalData);
        ui.append(<SmartContractDisplay contractCode={JSON.stringify((values as any).finalData, null, 2)} />);
      }
    }
    
    }
  }

  ui.done();
  return { 
    ui: ui.value, 
    responseContent: aiResponseContent,
    graphState: graphState // Return the complete graph state with enhanced tracking
  };
}

export function exposeEndpoints<T extends Record<string, unknown>>(
  actions: T,
): {
  (props: { children: ReactNode }): Promise<JSX.Element>;
  $$types?: T;
} {
  return async function AI(props: { children: ReactNode }) {
    return <AIProvider actions={actions}>{props.children}</AIProvider>;
  };
}
