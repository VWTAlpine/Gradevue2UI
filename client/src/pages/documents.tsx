import { useState, useEffect, useMemo, useRef } from "react";
import { useGrades } from "@/lib/gradeContext";
import { StudentVueClient, parseDocuments, type ParsedDocument } from "@/lib/studentvue-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderOpen, FileText, Loader2, RefreshCw, Clock, Download, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentWithUrl extends ParsedDocument {
  blobUrl?: string;
}

export default function DocumentsPage() {
  const { credentials } = useGrades();
  const [documents, setDocuments] = useState<DocumentWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());
  const blobUrlCache = useRef<Map<string, string>>(new Map());
  const { toast } = useToast();

  const fetchDocuments = async () => {
    if (!credentials) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      let documentsData = null;

      try {
        const client = new StudentVueClient(
          credentials.district,
          credentials.username,
          credentials.password
        );
        await client.checkLogin();
        const rawDocs = await client.studentDocuments();
        documentsData = parseDocuments(rawDocs);
      } catch (clientErr: any) {
        console.log("Client-side documents fetch failed, trying server:", clientErr.message);
        const res = await fetch("/api/studentvue/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
          credentials: "include",
        });
        const response = await res.json();
        if (response.success && response.data) {
          documentsData = response.data;
        }
      }

      if (documentsData) {
        setDocuments(documentsData.documents || []);
        setLastUpdated(new Date());
      }
    } catch (err: any) {
      console.error("Error fetching documents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [credentials]);

  const fetchDocumentBlobUrl = async (documentGU: string): Promise<string | null> => {
    if (!credentials || !documentGU) return null;
    
    // Check cache first
    if (blobUrlCache.current.has(documentGU)) {
      return blobUrlCache.current.get(documentGU)!;
    }

    try {
      // Use server-side endpoint for document content (more reliable than client-side CORS)
      const res = await fetch(`/api/studentvue/document/${encodeURIComponent(documentGU)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      const response = await res.json();
      
      if (response.success && response.data && response.data.base64) {
        // Convert base64 to blob URL
        const byteCharacters = atob(response.data.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const blobUrl = URL.createObjectURL(blob);
        
        // Cache the URL
        blobUrlCache.current.set(documentGU, blobUrl);
        return blobUrl;
      }
    } catch (err) {
      console.error("Error fetching document blob:", err);
    }
    
    return null;
  };

  const openDocument = async (doc: DocumentWithUrl) => {
    if (!credentials || !doc.documentGU) {
      toast({
        title: "Cannot Open",
        description: "Document is not available",
        variant: "destructive",
      });
      return;
    }

    // If we already have the blob URL, open it directly
    if (doc.blobUrl) {
      window.open(doc.blobUrl, "_blank");
      return;
    }

    setDownloadingDoc(doc.documentGU);
    setLoadingUrls(prev => new Set(prev).add(doc.documentGU));

    try {
      const blobUrl = await fetchDocumentBlobUrl(doc.documentGU);
      
      if (blobUrl) {
        // Update document with blob URL
        setDocuments(prev => 
          prev.map(d => 
            d.documentGU === doc.documentGU ? { ...d, blobUrl } : d
          )
        );
        
        // Open in new tab
        window.open(blobUrl, "_blank");
      } else {
        throw new Error("Could not load document");
      }
    } catch (err: any) {
      console.error("Error opening document:", err);
      toast({
        title: "Failed to Open",
        description: "Could not open the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingDoc(null);
      setLoadingUrls(prev => {
        const newSet = new Set(prev);
        newSet.delete(doc.documentGU);
        return newSet;
      });
    }
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      blobUrlCache.current.forEach(url => URL.revokeObjectURL(url));
      blobUrlCache.current.clear();
    };
  }, []);

  const documentTypes = useMemo(() => {
    const types = new Set<string>();
    documents.forEach((doc) => {
      if (doc.type) types.add(doc.type);
    });
    return Array.from(types).sort();
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    if (activeTab === "all") return documents;
    return documents.filter((doc) => doc.type === activeTab);
  }, [documents, activeTab]);

  const getTypeColor = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes("report card")) return "bg-amber-600 text-white dark:bg-amber-700";
    if (typeLower.includes("progress")) return "bg-blue-600 text-white dark:bg-blue-700";
    if (typeLower.includes("growth") || typeLower.includes("map")) return "bg-emerald-600 text-white dark:bg-emerald-700";
    if (typeLower.includes("vvaas") || typeLower.includes("assessment")) return "bg-purple-600 text-white dark:bg-purple-700";
    if (typeLower.includes("course") || typeLower.includes("request")) return "bg-cyan-600 text-white dark:bg-cyan-700";
    return "bg-muted-foreground text-white";
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
        return `${month}/${day}/${year % 100}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const getTimeSinceUpdate = () => {
    if (!lastUpdated) return "";
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000 / 60);
    if (diff < 1) return "Just now";
    if (diff === 1) return "1 minute ago";
    return `${diff} minutes ago`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Documents</h1>
          <p className="mt-1 text-muted-foreground">
            View your report cards, progress reports, and other documents
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last updated {getTimeSinceUpdate()}</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDocuments}
            disabled={isLoading}
            data-testid="button-refresh-documents"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {documents.length === 0 ? (
        <Card className="overflow-visible">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No documents available</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Documents like report cards and progress reports will appear here once they are available from StudentVue.
              <br />
              Note: Document availability varies by district.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-visible">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b px-6 pt-4">
                <TabsList className="h-auto flex-wrap gap-2 bg-transparent p-0">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-muted rounded-none border-b-2 border-transparent px-3 pb-3 data-[state=active]:border-primary"
                    data-testid="tab-all-documents"
                  >
                    All
                  </TabsTrigger>
                  {documentTypes.map((type) => (
                    <TabsTrigger
                      key={type}
                      value={type}
                      className="data-[state=active]:bg-muted rounded-none border-b-2 border-transparent px-3 pb-3 data-[state=active]:border-primary"
                      data-testid={`tab-${type.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      {type}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              <TabsContent value={activeTab} className="mt-0">
                <div className="divide-y divide-border">
                  {filteredDocuments.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-4 px-6 py-4 hover-elevate cursor-pointer"
                      onClick={() => openDocument(doc)}
                      data-testid={`document-row-${index}`}
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{doc.name}</span>
                        {doc.date && (
                          <Badge variant="outline" className="text-muted-foreground">
                            {formatDate(doc.date)}
                          </Badge>
                        )}
                        {doc.type && (
                          <Badge className={getTypeColor(doc.type)}>
                            {doc.type}
                          </Badge>
                        )}
                        {doc.blobUrl && (
                          <Badge variant="secondary" className="text-xs">
                            Loaded
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={loadingUrls.has(doc.documentGU)}
                        onClick={(e) => {
                          e.stopPropagation();
                          openDocument(doc);
                        }}
                        data-testid={`button-open-${index}`}
                      >
                        {loadingUrls.has(doc.documentGU) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
