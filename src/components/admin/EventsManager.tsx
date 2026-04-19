import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, X, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { convertToWebp } from "@/lib/convertToWebp";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";

type EventRow = {
  id: string;
  title: string;
  event_date: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

type EventForm = {
  title: string;
  event_date: string; // datetime-local string
  description: string;
  image_url: string | null;
};

const emptyForm: EventForm = { title: "", event_date: "", description: "", image_url: null };

const toLocalInputValue = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EventsManager = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });
    if (!error && data) setEvents(data as EventRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (ev: EventRow) => {
    setEditing(ev);
    setForm({
      title: ev.title,
      event_date: toLocalInputValue(ev.event_date),
      description: ev.description ?? "",
      image_url: ev.image_url,
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const webpBlob = await convertToWebp(file);
      const path = `events/${crypto.randomUUID()}.webp`;
      const { error } = await supabase.storage
        .from("record-images")
        .upload(path, webpBlob, { contentType: "image/webp" });
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } else {
        const { data: urlData } = supabase.storage.from("record-images").getPublicUrl(path);
        setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: "Conversion image échouée", variant: "destructive" });
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.event_date) {
      toast({ title: "Champs requis", description: "Le titre et la date sont obligatoires.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      event_date: new Date(form.event_date).toISOString(),
      description: form.description.trim() || null,
      image_url: form.image_url,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("events").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("events").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Évènement modifié" : "Évènement créé" });
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    fetchEvents();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("events").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Évènement supprimé" });
      fetchEvents();
    }
    setDeleteId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Évènements</h2>
          <p className="text-sm text-muted-foreground font-body">Créez et gérez les évènements à venir.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-3 py-2 bg-foreground text-background font-body font-medium rounded-sm text-sm hover:opacity-85 transition-all"
        >
          <Plus className="w-4 h-4" /> Nouvel évènement
        </button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground font-body py-12">Chargement…</p>
      ) : events.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-md">
          <CalendarIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground font-body text-sm">Aucun évènement pour l'instant.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev) => (
            <div key={ev.id} className="bg-card border border-border rounded-md overflow-hidden flex flex-col">
              {ev.image_url && (
                <img src={ev.image_url} alt={ev.title} loading="lazy" className="w-full aspect-square object-cover" />
              )}
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-xs text-accent font-body uppercase tracking-wide flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  {new Date(ev.event_date).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}
                </p>
                <h3 className="font-display font-bold text-foreground mt-1">{ev.title}</h3>
                {ev.description && (
                  <p className="text-sm text-muted-foreground font-body mt-2 line-clamp-3">{ev.description}</p>
                )}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                  <button
                    onClick={() => openEdit(ev)}
                    className="inline-flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Modifier
                  </button>
                  <button
                    onClick={() => setDeleteId(ev.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-destructive transition-colors ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-md border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold">{editing ? "Modifier" : "Nouvel"} évènement</h3>
              <button onClick={() => { setShowForm(false); setEditing(null); }}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Titre *"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-muted border border-border rounded-sm px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
              />
              <div>
                <label className="block text-sm font-body text-muted-foreground mb-2">Date et heure *</label>
                <input
                  type="datetime-local"
                  required
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  className="w-full bg-muted border border-border rounded-sm px-4 py-3 text-sm font-body text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <textarea
                rows={4}
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-muted border border-border rounded-sm px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent resize-none"
              />
              <div>
                <label className="block text-sm font-body text-muted-foreground mb-2">Image</label>
                {form.image_url && (
                  <img src={form.image_url} alt="Aperçu" className="w-24 h-24 object-cover rounded-sm mb-2" />
                )}
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-sm text-sm font-body text-muted-foreground hover:border-accent cursor-pointer transition-colors">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Envoi…" : form.image_url ? "Changer l'image" : "Choisir une image"}
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-foreground text-background font-body font-semibold rounded-sm uppercase text-sm hover:opacity-85 transition-all disabled:opacity-50"
              >
                {saving ? "Enregistrement…" : editing ? "Modifier" : "Créer"}
              </button>
            </form>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'évènement ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventsManager;
