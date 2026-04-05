import { useEffect, useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, LogOut, Upload, X, Video, Camera, Loader2, ImageIcon } from "lucide-react";
import SuggestionPopup from "@/components/admin/SuggestionPopup";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile, useIsTablet, useIsTouchDevice } from "@/hooks/use-mobile";
import { usePinchGrid } from "@/hooks/use-pinch-grid";
import type { Database } from "@/integrations/supabase/types";

type Record = Database["public"]["Tables"]["records"]["Row"];
type RecordInsert = Database["public"]["Tables"]["records"]["Insert"];

const AdminPanel = () => {
  const isMobile = useIsMobile();
  const desktopFileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const [duplicateCategories, setDuplicateCategories] = useState<string[]>([]);
  const [duplicateRecords, setDuplicateRecords] = useState<Record[]>([]);
  const [showSpellingCorrection, setShowSpellingCorrection] = useState(false);
  const [spellingCorrection, setSpellingCorrection] = useState<{ correctedArtist: string | null; correctedTitle: string | null }>({ correctedArtist: null, correctedTitle: null });
  const [pendingSpellingForm, setPendingSpellingForm] = useState<RecordInsert | null>(null);
  const [spellingChecking, setSpellingChecking] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoSaving, setVideoSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("vinyl");
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [conditionIsCustom, setConditionIsCustom] = useState(false);
  const [showMultiple, setShowMultiple] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<{ imageUrl: string | null; description: string | null; genre: string | null } | null>(null);
  const [pendingForm, setPendingForm] = useState<RecordInsert | null>(null);
  const [skipSuggestions, setSkipSuggestions] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [showScanMenu, setShowScanMenu] = useState(false);
  const navigate = useNavigate();
  const { cols, gridRef, setCols } = usePinchGrid(2);
  const scrollToIdRef = useRef<string | null>(null);
  const prevColsRef = useRef<number | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const prevCols = prevColsRef.current;
    prevColsRef.current = cols;
    if (cols === null) return;
    if (scrollToIdRef.current && cols === 1) {
      const id = scrollToIdRef.current;
      scrollToIdRef.current = null;
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-record-id="${id}"]`);
        if (el) el.scrollIntoView({ behavior: "instant", block: "center" });
      });
      return;
    }
    if (prevCols === 1 && cols > 1 && expandedId) {
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-record-id="${expandedId}"]`);
        if (el) el.scrollIntoView({ behavior: "instant", block: "center" });
      });
    }
  }, [cols, expandedId]);

  const [form, setForm] = useState<RecordInsert>({
    title: "", artist: "", genre: "", price: null, condition: "",
    description: "", category: "vinyl", image_url: null,
  });

  useEffect(() => {
    checkAuth();
    fetchRecords();
    fetchVideoUrl();
  }, []);

  const fetchVideoUrl = async () => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "gallery_video_url").single();
    if (data) setVideoUrl(data.value);
  };

  const handleSaveVideo = async () => {
    setVideoSaving(true);
    await supabase.from("site_settings").update({ value: videoUrl }).eq("key", "gallery_video_url");
    setVideoSaving(false);
  };

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/admin/login"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
    if (!roles || roles.length === 0) { navigate("/admin/login"); }
  };

  const fetchRecords = async () => {
    const { data } = await supabase.from("records").select("*").order("artist", { ascending: true }).order("title", { ascending: true });
    setRecords(data || []);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("record-images").upload(path, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from("record-images").getPublicUrl(path);
      setForm({ ...form, image_url: urlData.publicUrl });
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedForm = { ...form, category: form.category || activeTab };

    if (editingRecord) {
      const { error } = await supabase.from("records").update(normalizedForm).eq("id", editingRecord.id);
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        return;
      }
      setShowForm(false);
      setEditingRecord(null);
      setForm({ title: "", artist: "", genre: "", price: null, condition: "", description: "", category: activeTab, image_url: null });
      fetchRecords();
    } else {
      // Spelling check first
      if (!skipSuggestions && !spellingChecking) {
        setSpellingChecking(true);
        try {
          const { data: spellData } = await supabase.functions.invoke("suggest-record-info", {
            body: { title: normalizedForm.title, artist: normalizedForm.artist, category: normalizedForm.category, needsImage: false, needsDescription: false, needsGenre: false, checkSpelling: true },
          });
          if (spellData && (spellData.correctedArtist || spellData.correctedTitle)) {
            setSpellingCorrection({ correctedArtist: spellData.correctedArtist, correctedTitle: spellData.correctedTitle });
            setPendingSpellingForm(normalizedForm);
            setSpellingChecking(false);
            setShowSpellingCorrection(true);
            return;
          }
        } catch (e) {
          console.error("Spelling check error:", e);
        }
        setSpellingChecking(false);
      }

      // Duplicate check
      const { data: existing } = await supabase
        .from("records")
        .select("id, category, quantity")
        .ilike("title", normalizedForm.title)
        .ilike("artist", normalizedForm.artist);
      if (existing && existing.length > 0) {
        const catMap: { [key: string]: string } = { vinyl: "Vinyles", editions_originales: "Éd. Originales", cd: "CD Audio", hifi: "Hi-Fi" };
        const cats = [...new Set(existing.map((r: any) => catMap[r.category] || r.category))];
        setDuplicateCategories(cats);
        setDuplicateRecords(existing as Record[]);
        setShowDuplicateConfirm(true);
      } else {
        await proceedWithInsert(normalizedForm);
      }
    }
  };

  const handleSpellingAccept = () => {
    if (!pendingSpellingForm) return;
    const corrected = { ...pendingSpellingForm };
    if (spellingCorrection.correctedArtist) corrected.artist = spellingCorrection.correctedArtist;
    if (spellingCorrection.correctedTitle) corrected.title = spellingCorrection.correctedTitle;
    setForm(corrected);
    setShowSpellingCorrection(false);
    setPendingSpellingForm(null);
    setSpellingCorrection({ correctedArtist: null, correctedTitle: null });
    toast({ title: "Correction appliquée", description: "Vérifiez le formulaire puis cliquez sur Ajouter." });
  };

  const handleSpellingReject = async () => {
    if (!pendingSpellingForm) return;
    setShowSpellingCorrection(false);
    const formToUse = { ...pendingSpellingForm };
    setPendingSpellingForm(null);
    setSpellingCorrection({ correctedArtist: null, correctedTitle: null });
    // Continue with duplicate check
    const { data: existing } = await supabase
      .from("records")
      .select("id, category, quantity")
      .ilike("title", formToUse.title)
      .ilike("artist", formToUse.artist);
    if (existing && existing.length > 0) {
      const catMap: { [key: string]: string } = { vinyl: "Vinyles", editions_originales: "Éd. Originales", cd: "CD Audio", hifi: "Hi-Fi" };
      const cats = [...new Set(existing.map((r: any) => catMap[r.category] || r.category))];
      setDuplicateCategories(cats);
      setDuplicateRecords(existing as Record[]);
      setShowDuplicateConfirm(true);
    } else {
      await proceedWithInsert(formToUse);
    }
  };

  const proceedWithInsert = async (formData: RecordInsert) => {
    const needsImage = !formData.image_url;
    const needsDescription = !formData.description;
    const needsGenre = !formData.genre;
    if ((needsImage || needsDescription || needsGenre) && !skipSuggestions) {
      setPendingForm(formData);
      setSuggestionLoading(true);
      setSuggestion(null);
      setShowForm(false);
      try {
        const { data, error } = await supabase.functions.invoke("suggest-record-info", {
          body: { title: formData.title, artist: formData.artist, category: formData.category, needsImage, needsDescription, needsGenre },
        });
        if (!error && data) {
          const hasVisualSuggestion = (needsImage && data.imageUrl) || (needsDescription && data.description);
          if (hasVisualSuggestion) {
            setSuggestion({
              imageUrl: needsImage ? data.imageUrl : null,
              description: needsDescription ? data.description : null,
              genre: needsGenre ? data.genre : null,
            });
            setSuggestionLoading(false);
            return;
          }
          // Only genre found, apply silently
          if (needsGenre && data.genre) {
            formData = { ...formData, genre: data.genre };
          }
        }
      } catch (e) {
        console.error("Suggestion error:", e);
      }
      setSuggestionLoading(false);
      setSuggestion(null);
      setPendingForm(null);
      await insertRecord(formData);
    } else {
      await insertRecord(formData);
    }
  };

  const handleSuggestionAccept = async (imageUrl: string | null, description: string | null) => {
    if (!pendingForm) return;
    const updatedForm = { ...pendingForm };

    if (suggestion?.genre && !updatedForm.genre) {
      updatedForm.genre = suggestion.genre;
    }

    if (imageUrl) {
      try {
        const resp = await fetch(imageUrl);
        const blob = await resp.blob();
        const ext = "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("record-images").upload(path, blob);
        if (!error) {
          const { data: urlData } = supabase.storage.from("record-images").getPublicUrl(path);
          updatedForm.image_url = urlData.publicUrl;
        }
      } catch (e) {
        console.error("Image upload error:", e);
      }
    }
    if (description) updatedForm.description = description;

    setSuggestion(null);
    setSuggestionLoading(false);
    setPendingForm(null);
    setForm(updatedForm);
    setSkipSuggestions(true);
    setShowForm(true);
  };

  const handleSuggestionReject = () => {
    if (!pendingForm) return;
    const updatedForm = { ...pendingForm };
    if (suggestion?.genre && !updatedForm.genre) {
      updatedForm.genre = suggestion.genre;
    }
    setSuggestion(null);
    setSuggestionLoading(false);
    setPendingForm(null);
    setForm(updatedForm);
    setSkipSuggestions(true);
    setShowForm(true);
  };

  const insertRecord = async (formData: RecordInsert) => {
    const payload = { ...formData, category: formData.category || activeTab };
    const { error } = await supabase.from("records").insert(payload);
    if (error) {
      console.error("Insert error:", error);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    setShowForm(false);
    setShowDuplicateConfirm(false);
    setEditingRecord(null);
    setForm({ title: "", artist: "", genre: "", price: null, condition: "", description: "", category: activeTab, image_url: null });
    setSkipSuggestions(false);
    fetchRecords();
  };

  const insertAndReset = async () => {
    setShowDuplicateConfirm(false);
    await proceedWithInsert({ ...form, category: form.category || activeTab });
  };

  const incrementDuplicate = async () => {
    setShowDuplicateConfirm(false);
    if (duplicateRecords.length > 0) {
      const dup = duplicateRecords[0];
      const { error } = await supabase
        .from("records")
        .update({ quantity: dup.quantity + 1 })
        .eq("id", dup.id);
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } else {
        const catMap: { [key: string]: string } = { vinyl: "Vinyles", editions_originales: "Éd. Originales", cd: "CD Audio", hifi: "Hi-Fi" };
        toast({ title: "Quantité mise à jour", description: `+1 exemplaire ajouté à « ${dup.title} » (${catMap[dup.category] || dup.category})` });
        setShowForm(false);
        setForm({ title: "", artist: "", genre: "", price: null, condition: "", description: "", category: activeTab, image_url: null });
        fetchRecords();
      }
    }
  };

  const handleEdit = (record: Record) => {
    setEditingRecord(record);
    setConditionIsCustom(false);
    setForm({
      title: record.title, artist: record.artist, genre: record.genre,
      price: record.price, condition: record.condition, description: record.description,
      category: record.category, image_url: record.image_url,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet article ?")) return;
    await supabase.from("records").delete().eq("id", id);
    fetchRecords();
  };

  const handleQuantityChange = async (record: Record, delta: number) => {
    const newQty = Math.max(0, (record.quantity ?? 1) + delta);
    await supabase.from("records").update({ quantity: newQty, is_sold: newQty === 0 }).eq("id", record.id);
    fetchRecords();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRecognizing(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("recognize-record", {
        body: { imageBase64: base64, category: form.category || activeTab },
      });

      if (error) throw error;

      if (data?.recognized) {
        const recognizedTitle = data.title || form.title;
        const recognizedArtist = data.artist || form.artist;
        const recognizedCategory = form.category || activeTab;
        setForm((prev) => ({
          ...prev,
          title: data.title || prev.title,
          artist: data.artist || prev.artist,
          genre: data.genre || prev.genre,
          condition: data.condition || prev.condition,
        }));
        toast({ title: "Article reconnu !", description: `${recognizedTitle} — ${recognizedArtist}` });

        // Trigger suggestion popup (same flow as manual entry)
        if (recognizedTitle && recognizedArtist) {
          try {
            setSuggestionLoading(true);
            setSuggestion(null);
            const recognizedForm: RecordInsert = {
              title: recognizedTitle,
              artist: recognizedArtist,
              genre: data.genre || form.genre || "",
              condition: data.condition || form.condition || "",
              category: recognizedCategory,
              price: form.price,
              description: "",
              image_url: null,
            };
            setPendingForm(recognizedForm);
            const { data: suggestData } = await supabase.functions.invoke("suggest-record-info", {
              body: { title: recognizedTitle, artist: recognizedArtist, category: recognizedCategory, needsImage: true, needsDescription: true, needsGenre: true },
            });
            if (suggestData) {
              const hasVisualSuggestion = suggestData.imageUrl || suggestData.description;
              if (hasVisualSuggestion) {
                setSuggestion({
                  imageUrl: suggestData.imageUrl || null,
                  description: suggestData.description || null,
                  genre: suggestData.genre || null,
                });
                setSuggestionLoading(false);
              } else {
                // Only genre, apply silently and go back to form
                if (suggestData.genre) {
                  setForm((prev) => ({ ...prev, ...recognizedForm, genre: suggestData.genre }));
                }
                setSuggestionLoading(false);
                setPendingForm(null);
              }
            } else {
              setSuggestionLoading(false);
              setPendingForm(null);
              setForm((prev) => ({ ...prev, ...recognizedForm }));
            }
          } catch (suggestErr) {
            console.error("Suggest after recognition error:", suggestErr);
            setSuggestionLoading(false);
            setPendingForm(null);
          }
        }
      } else {
        toast({ title: "Article non reconnu", description: "Complétez les champs manuellement.", variant: "destructive" });
      }
    } catch (err) {
      console.error("Recognition error:", err);
      toast({ title: "Erreur de reconnaissance", description: "Impossible d'analyser la photo.", variant: "destructive" });
    } finally {
      setRecognizing(false);
      e.target.value = "";
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-body">Chargement…</div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-display font-bold text-gradient-dark">Admin — Divinyl</h1>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Video URL Setting */}
        <div className="bg-card border border-border rounded-md p-4 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Video className="w-4 h-4 text-accent" />
            <h2 className="font-display font-bold text-foreground text-sm">Vidéo de la galerie</h2>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="URL de la vidéo Facebook embed"
              className="flex-1 bg-muted border border-border rounded-sm px-4 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
            />
            <button
              onClick={handleSaveVideo}
              disabled={videoSaving}
              className="px-4 py-2 bg-foreground text-background font-body font-medium rounded-sm text-sm hover:opacity-85 transition-all disabled:opacity-50"
            >
              {videoSaving ? "…" : "Enregistrer"}
            </button>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-md border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold">{editingRecord ? "Modifier" : "Ajouter"} un article</h2>
                <div className="flex items-center gap-2">
                  {!editingRecord && (
                      <>
                        <button
                          type="button"
                          disabled={recognizing}
                          onClick={() => {
                            if (isMobile) {
                              setShowScanMenu(true);
                            } else {
                              desktopFileRef.current?.click();
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 px-2 py-1.5 border border-accent rounded-sm text-sm font-body text-accent hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors ${recognizing ? "opacity-50 pointer-events-none" : ""}`}
                          title="Scanner un article"
                        >
                          {recognizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                        </button>
                        <input ref={desktopFileRef} type="file" accept="image/*" onChange={handleCameraCapture} className="hidden" />
                        <Drawer open={showScanMenu} onOpenChange={setShowScanMenu}>
                          <DrawerContent>
                            <DrawerHeader>
                              <DrawerTitle className="font-display">Scanner un article</DrawerTitle>
                            </DrawerHeader>
                            <div className="px-4 pb-6 space-y-2">
                              <label className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted cursor-pointer text-sm font-body transition-colors">
                                <Camera className="w-5 h-5 text-accent" /> Prendre une photo
                                <input type="file" accept="image/*" capture="environment" onChange={(e) => { setShowScanMenu(false); handleCameraCapture(e); }} className="hidden" />
                              </label>
                              <label className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted cursor-pointer text-sm font-body transition-colors">
                                <ImageIcon className="w-5 h-5 text-accent" /> Choisir depuis la galerie
                                <input type="file" accept="image/*" onChange={(e) => { setShowScanMenu(false); handleCameraCapture(e); }} className="hidden" />
                              </label>
                            </div>
                          </DrawerContent>
                        </Drawer>
                      </>
                  )}
                  <button onClick={() => { setShowForm(false); setEditingRecord(null); }}>
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-muted border border-border rounded-sm px-4 py-3 text-sm font-body text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="vinyl">Vinyle</option>
                  <option value="editions_originales">Édition Originale</option>
                  <option value="cd">CD Audio</option>
                  <option value="hifi">Hi-Fi</option>
                </select>
                <input type="text" placeholder="Titre *" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-muted border border-border rounded-sm px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent" />
                <input type="text" placeholder="Artiste / Marque *" required value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })}
                  className="w-full bg-muted border border-border rounded-sm px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Genre" value={form.genre || ""} onChange={(e) => setForm({ ...form, genre: e.target.value })}
                    className="w-full bg-muted border border-border rounded-sm px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent" />
                  <input type="number" step="0.01" placeholder="Prix (€)" value={form.price || ""} onChange={(e) => setForm({ ...form, price: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full bg-muted border border-border rounded-sm px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent" />
                </div>
                <div className="space-y-2">
                  <select
                    value={form.condition?.startsWith("Occasion") ? "Occasion" : form.condition === "Neuf" ? "Neuf" : form.condition ? "Occasion" : ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConditionIsCustom(false);
                      setForm({ ...form, condition: val || null });
                    }}
                    className="w-full bg-muted border border-border rounded-sm px-4 py-3 text-sm font-body text-foreground focus:outline-none focus:border-accent"
                  >
                    <option value="">État</option>
                    <option value="Neuf">Neuf</option>
                    <option value="Occasion">Occasion</option>
                  </select>
                  {(form.condition?.startsWith("Occasion") || (form.condition && form.condition !== "Neuf")) && (
                    <input type="text" placeholder="Précisez l'état (optionnel)"
                      value={form.condition === "Occasion" ? "" : (form.condition?.replace(/^Occasion\s*[·—-]\s*/, "") || "")}
                      onChange={(e) => setForm({ ...form, condition: e.target.value ? `Occasion · ${e.target.value}` : "Occasion" })}
                      className="w-full bg-muted border border-border rounded-sm px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent" />
                  )}
                </div>
                <textarea rows={3} placeholder="Description" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-muted border border-border rounded-sm px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent resize-none" />

                {/* Image upload */}
                <div>
                  <label className="block text-sm font-body text-muted-foreground mb-2">Photo</label>
                  {form.image_url && (
                    <img src={form.image_url} alt="Preview" className="w-24 h-24 object-cover rounded-sm mb-2" />
                  )}
                  <label className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-sm text-sm font-body text-muted-foreground hover:border-accent cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    {uploading ? "Envoi…" : "Choisir une image"}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>

                <button type="submit" className="w-full py-3 bg-foreground text-background font-body font-semibold rounded-sm uppercase text-sm hover:opacity-85 transition-all">
                  {editingRecord ? "Modifier" : "Ajouter"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Spelling correction modal */}
        {showSpellingCorrection && (
          <div className="fixed inset-0 bg-foreground/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-background rounded-md border border-border p-6 w-full max-w-sm text-center">
              <h3 className="font-display font-bold text-foreground text-lg mb-2">Correction suggérée</h3>
              <div className="text-sm text-muted-foreground font-body mb-4 space-y-2">
                {spellingCorrection.correctedArtist && (
                  <p>
                    Artiste : <span className="line-through text-destructive">{pendingSpellingForm?.artist}</span> → <span className="font-semibold text-foreground">{spellingCorrection.correctedArtist}</span>
                  </p>
                )}
                {spellingCorrection.correctedTitle && (
                  <p>
                    Titre : <span className="line-through text-destructive">{pendingSpellingForm?.title}</span> → <span className="font-semibold text-foreground">{spellingCorrection.correctedTitle}</span>
                  </p>
                )}
              </div>
              <p className="text-sm text-muted-foreground font-body mb-6">Voulez-vous appliquer cette correction ?</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleSpellingReject}
                  className="px-6 py-2 border border-border rounded-sm text-sm font-body font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Non
                </button>
                <button
                  onClick={handleSpellingAccept}
                  className="px-6 py-2 bg-foreground text-background rounded-sm text-sm font-body font-semibold hover:opacity-85 transition-all"
                >
                  Corriger
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Duplicate confirmation modal */}
        {showDuplicateConfirm && (
          <div className="fixed inset-0 bg-foreground/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-background rounded-md border border-border p-6 w-full max-w-sm text-center">
              <h3 className="font-display font-bold text-foreground text-lg mb-2">Doublon détecté</h3>
              <p className="text-sm text-muted-foreground font-body mb-4">
                Un article « {form.title} » de « {form.artist} » existe déjà dans : <span className="font-semibold text-foreground">{duplicateCategories.join(", ")}</span>.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={incrementDuplicate}
                  className="w-full px-6 py-2 bg-foreground text-background rounded-sm text-sm font-body font-semibold hover:opacity-85 transition-all"
                >
                  +1 à l'existant
                </button>
                <button
                  onClick={insertAndReset}
                  className="w-full px-6 py-2 border border-border rounded-sm text-sm font-body font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Créer quand même
                </button>
                <button
                  onClick={() => setShowDuplicateConfirm(false)}
                  className="w-full px-6 py-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Suggestion popup */}
        {(suggestionLoading || suggestion) && pendingForm && (
          <SuggestionPopup
            title={pendingForm.title}
            artist={pendingForm.artist}
            imageUrl={suggestion?.imageUrl || null}
            description={suggestion?.description || null}
            loading={suggestionLoading}
            onAccept={handleSuggestionAccept}
            onReject={handleSuggestionReject}
          />
        )}

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "vinyl", label: "Vinyles" },
              { key: "editions_originales", label: "Éd. Orig." },
              { key: "cd", label: "CD Audio" },
              { key: "hifi", label: "Hi-Fi" },
            ].map((tab) => {
              const filtered = records.filter((r) => r.category === tab.key);
              const articleCount = filtered.length;
              const totalCopies = filtered.reduce((sum, r) => sum + (r.quantity ?? 1), 0);
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-2 text-xs sm:text-sm font-body font-medium rounded-sm transition-all flex flex-col items-center gap-0.5 flex-1 min-w-0 ${activeTab === tab.key ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  <span className="inline-flex items-center gap-1 sm:gap-1.5">
                    <span className="truncate">{tab.label}</span>
                    <span className={`text-[10px] sm:text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center ${activeTab === tab.key ? "bg-background/20" : "bg-border"}`}>
                      {totalCopies}
                    </span>
                  </span>
                  <span className={`text-[9px] sm:text-[10px] font-body leading-none ${activeTab === tab.key ? "text-background/50" : "text-muted-foreground/50"}`}>
                      {articleCount} réf.
                    </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { setShowOutOfStock(!showOutOfStock); if (!showOutOfStock) setShowMultiple(false); }}
              className={`px-3 py-2 text-xs sm:text-sm font-body font-medium rounded-sm transition-all ${showOutOfStock ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              Plus en stock
            </button>
            <button
              onClick={() => { setShowMultiple(!showMultiple); if (!showMultiple) setShowOutOfStock(false); }}
              className={`px-3 py-2 text-xs sm:text-sm font-body font-medium rounded-sm transition-all ${showMultiple ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              Plusieurs ex.
            </button>
            <button
              onClick={() => { setEditingRecord(null); setForm({ title: "", artist: "", genre: "", price: null, condition: "", description: "", category: activeTab, image_url: null }); setSkipSuggestions(false); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-3 py-2 bg-foreground text-background font-body font-medium rounded-sm text-xs sm:text-sm hover:opacity-85 transition-all ml-auto"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
        </div>

        {/* Records list */}
        {records.filter((r) => r.category === activeTab && (showOutOfStock ? (r.quantity ?? 1) === 0 : showMultiple ? (r.quantity ?? 1) > 1 : true)).length === 0 ? (
          <p className="text-center text-muted-foreground font-body py-16">{showOutOfStock ? "Aucun article en rupture de stock." : showMultiple ? "Aucun article avec plusieurs exemplaires." : "Aucun article dans cette catégorie."}</p>
        ) : (
          <div
            ref={gridRef}
            className={`grid ${
              cols === 3 ? "grid-cols-3 gap-2" : cols === 2 ? "grid-cols-2 gap-3" : "grid-cols-1 gap-4"
            } md:grid-cols-2 lg:grid-cols-3`}
            style={{ touchAction: "manipulation" }}
          >
            {records.filter((r) => r.category === activeTab && (showOutOfStock ? (r.quantity ?? 1) === 0 : showMultiple ? (r.quantity ?? 1) > 1 : true)).map((record) => {
              const isCompact = cols && cols >= 2;
              return (
                <div
                  key={record.id}
                  data-record-id={record.id}
                  className={`bg-card border border-border rounded-md overflow-hidden cursor-pointer ${(record.quantity ?? 1) === 0 ? "opacity-60" : ""} ${isCompact ? "" : "p-4"}`}
                  onClick={() => {
                    if (cols && cols >= 2) {
                      scrollToIdRef.current = record.id;
                      setCols(1);
                      setExpandedId(record.id);
                    } else {
                      setExpandedId(expandedId === record.id ? null : record.id);
                    }
                  }}
                >
                  {record.image_url && (
                    <img src={record.image_url} alt={record.title} className={`w-full aspect-square object-cover ${isCompact ? "" : "rounded-sm mb-3"}`} loading="lazy" />
                  )}
                  {isCompact ? (
                    <div className="p-2">
                      <h3 className="font-display font-bold text-foreground text-[11px] line-clamp-1">{record.title}</h3>
                      <p className="text-muted-foreground font-body text-[10px] line-clamp-1">{record.artist}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-[9px] rounded-sm px-1 py-0.5 font-body font-semibold ${(record.quantity ?? 1) === 0 ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>
                          {(record.quantity ?? 1) === 0 ? "Vendu" : `×${record.quantity ?? 1}`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-accent font-body uppercase tracking-wide">{record.category === "vinyl" ? "Vinyle" : record.category === "cd" ? "CD Audio" : record.category === "hifi" ? "Hi-Fi" : "Éd. Originale"} {record.genre && `· ${record.genre}`}</p>
                        <h3 className="font-display font-bold text-foreground truncate">{record.title}</h3>
                        <p className="text-sm text-muted-foreground font-body">{record.artist}</p>
                        {record.price && <p className="text-sm font-body font-semibold text-foreground mt-1">{record.price} €</p>}
                        {record.condition && <p className="text-xs text-muted-foreground font-body">État : {record.condition}</p>}
                        {(record.quantity ?? 1) === 0 && <span className="inline-block text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-sm mt-1 font-body">Vendu</span>}
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0 items-center">
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(record); }} className="text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-4 h-4" /></button>
                        <div className="flex items-center gap-1 border border-border rounded-sm">
                          <button onClick={(e) => { e.stopPropagation(); handleQuantityChange(record, -1); }} className="px-1.5 py-0.5 text-muted-foreground hover:text-foreground transition-colors text-sm font-body">−</button>
                          <span className="text-xs font-body font-semibold text-foreground min-w-[1.2rem] text-center">{record.quantity ?? 1}</span>
                          <button onClick={(e) => { e.stopPropagation(); handleQuantityChange(record, 1); }} className="px-1.5 py-0.5 text-muted-foreground hover:text-foreground transition-colors text-sm font-body">+</button>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
