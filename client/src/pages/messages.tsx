import { useState, useEffect, useMemo } from "react";
import { useGrades } from "@/lib/gradeContext";
import { StudentVueClient, parseMessages, type ParsedMessage } from "@/lib/studentvue-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, RefreshCw, Clock, User, ChevronDown, ChevronUp, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function MessagesPage() {
  const { credentials } = useGrades();
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchMessages = async () => {
    if (!credentials) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      let messagesData = null;

      try {
        const client = new StudentVueClient(
          credentials.district,
          credentials.username,
          credentials.password
        );
        await client.checkLogin();
        const rawMsgs = await client.messages();
        console.log("Raw messages data:", JSON.stringify(rawMsgs, null, 2));
        messagesData = parseMessages(rawMsgs);
      } catch (clientErr: any) {
        console.log("Client-side messages fetch failed, trying server:", clientErr.message);
        const res = await fetch("/api/studentvue/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
          credentials: "include",
        });
        const response = await res.json();
        if (response.success && response.data) {
          messagesData = response.data;
        }
      }

      if (messagesData) {
        setMessages(messagesData.messages || []);
        setLastUpdated(new Date());
      }
    } catch (err: any) {
      console.error("Error fetching messages:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [credentials]);

  const toggleMessage = (id: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
      if (parts) {
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        let year = parseInt(parts[3]);
        if (year < 100) year += 2000;
        
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const getTypeColor = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes("alert") || typeLower.includes("urgent")) {
      return "bg-red-600 text-white dark:bg-red-700";
    }
    if (typeLower.includes("activity") || typeLower.includes("student")) {
      return "bg-blue-600 text-white dark:bg-blue-700";
    }
    if (typeLower.includes("announcement")) {
      return "bg-amber-600 text-white dark:bg-amber-700";
    }
    return "bg-muted-foreground text-white";
  };

  const unreadCount = messages.filter(m => !m.read).length;

  if (!credentials) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Mail className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Messages Available</h2>
        <p className="text-muted-foreground">Please log in to view your messages.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Mail className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-messages-title">Messages</h1>
            {lastUpdated && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMessages}
          disabled={isLoading}
          data-testid="button-refresh-messages"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading messages...</span>
          </CardContent>
        </Card>
      ) : messages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Messages</h3>
            <p className="text-muted-foreground">You don't have any messages yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-lg">
                {messages.length} Message{messages.length !== 1 ? "s" : ""}
              </CardTitle>
              {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground">
                  {unreadCount} Unread
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {messages.map((message, index) => {
                const isExpanded = expandedMessages.has(message.id || String(index));
                
                return (
                  <Collapsible
                    key={message.id || index}
                    open={isExpanded}
                    onOpenChange={() => toggleMessage(message.id || String(index))}
                  >
                    <CollapsibleTrigger asChild>
                      <div
                        className="flex cursor-pointer items-start gap-4 px-6 py-4 hover-elevate"
                        data-testid={`message-row-${index}`}
                      >
                        <div className="flex-shrink-0 pt-1">
                          {!message.read && (
                            <Circle className="h-2 w-2 fill-primary text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className={`font-medium truncate ${!message.read ? "text-foreground" : "text-muted-foreground"}`}>
                              {message.subject}
                            </p>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            {message.from && (
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {message.from}
                              </span>
                            )}
                            {message.date && (
                              <span className="text-sm text-muted-foreground">
                                {formatDate(message.date)}
                              </span>
                            )}
                            {message.type && (
                              <Badge variant="secondary" className={`text-xs ${getTypeColor(message.type)}`}>
                                {message.type}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t border-border bg-muted/30 px-6 py-4">
                        {message.content ? (
                          <div 
                            className="prose prose-sm dark:prose-invert max-w-none text-sm"
                            dangerouslySetInnerHTML={{ __html: message.content }}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No content available</p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
