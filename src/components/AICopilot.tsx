import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AICopilot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI Prompt Co-Pilot. Let's build the perfect prompt together. What would you like to create a prompt for?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/copilot-chat`;
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context: messages.length === 1 ? input : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";

      const updateAssistantMessage = (content: string) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
          }
          return [...prev, { role: "assistant", content }];
        });
      };

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;

        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantMessage += content;
              
              // Check if final prompt is being generated
              if (assistantMessage.includes("FINAL_PROMPT:")) {
                const promptMatch = assistantMessage.match(/FINAL_PROMPT:\s*([\s\S]*)/);
                if (promptMatch) {
                  setFinalPrompt(promptMatch[1].trim());
                }
              }
              
              updateAssistantMessage(assistantMessage);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (finalPrompt) {
      navigator.clipboard.writeText(finalPrompt);
      setCopied(true);
      toast.success("Prompt copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hi! I'm your AI Prompt Co-Pilot. Let's build the perfect prompt together. What would you like to create a prompt for?",
      },
    ]);
    setFinalPrompt("");
    setInput("");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Co-Pilot Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea ref={scrollRef} className="h-[400px] w-full rounded-md border p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">
                      {message.content.replace(/FINAL_PROMPT:\s*/g, "")}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted max-w-[80%] rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/50" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/50 [animation-delay:0.2s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/50 [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your response..."
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {finalPrompt && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Final Prompt</span>
                  <Button
                    onClick={handleCopy}
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{finalPrompt}</p>
              </CardContent>
            </Card>
          )}

          <Button onClick={handleReset} variant="outline" className="w-full">
            Start New Conversation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
