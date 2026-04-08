"use client";

import { StreamableValue, useStreamableValue } from "ai/rsc";
import ReactMarkdown from 'react-markdown';

export function AIMessageText({ content }: { content: string }) {
  return (
    <div className="bg-slate-700/80 text-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-600/30 max-w-[85%] font-mono">
      <ReactMarkdown className="prose prose-invert max-w-none text-xs leading-relaxed">
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function HumanMessageText({ content }: { content: string }) {
  return (
    <div className="bg-blue-600 text-white px-3.5 py-2.5 rounded-lg mb-4 max-w-[85%] font-mono">
      <p className="whitespace-pre-wrap text-xs leading-relaxed">{content}</p>
    </div>
  );
}

export function AIMessage(props: { value: StreamableValue<string> }) {
  const [data] = useStreamableValue(props.value);

  if (!data) {
    return null;
  }
  return <AIMessageText content={data} />;
}
