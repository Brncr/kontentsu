import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SavedScript {
  id: string;
  user_id: string;
  news_title: string;
  news_url: string | null;
  news_source: string | null;
  niche: string | null;
  script_title: string | null;
  script_duration: string | null;
  script_hook: string | null;
  script_dev: string | null;
  script_cta: string | null;
  script_hashtags: string[];
  script_type: string;
  tweet_content: string | null;
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
}

interface SaveScriptInput {
  news_title: string;
  news_url?: string;
  news_source?: string;
  niche?: string;
  script_title?: string;
  script_duration?: string;
  script_hook?: string;
  script_dev?: string;
  script_cta?: string;
  script_hashtags?: string[];
  script_type?: string;
  tweet_content?: string;
}

export function useSavedScripts() {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<SavedScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, games: 0, web3: 0, tech: 0 });

  const fetchScripts = useCallback(async () => {
    if (!user) { setScripts([]); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("saved_scripts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const items = (data || []) as SavedScript[];
      setScripts(items);
      const active = items.filter((s) => !s.is_archived);
      setStats({
        total: active.length,
        games: active.filter((s) => s.niche === "games").length,
        web3: active.filter((s) => s.niche === "web3").length,
        tech: active.filter((s) => s.niche === "tech").length,
      });
    } catch (err) {
      console.error("Error fetching scripts:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchScripts(); }, [fetchScripts]);

  const saveScript = async (input: SaveScriptInput) => {
    if (!user) return;
    const { error } = await supabase.from("saved_scripts").insert({
      user_id: user.id,
      ...input,
    });
    if (error) throw error;
    await fetchScripts();
  };

  const deleteScript = async (id: string) => {
    const { error } = await supabase.from("saved_scripts").delete().eq("id", id);
    if (error) throw error;
    setScripts((prev) => prev.filter((s) => s.id !== id));
    setStats((prev) => {
      const deleted = scripts.find((s) => s.id === id);
      if (!deleted || deleted.is_archived) return { ...prev, total: prev.total };
      return {
        total: prev.total - 1,
        games: prev.games - (deleted?.niche === "games" ? 1 : 0),
        web3: prev.web3 - (deleted?.niche === "web3" ? 1 : 0),
        tech: prev.tech - (deleted?.niche === "tech" ? 1 : 0),
      };
    });
  };

  const toggleFavorite = async (id: string) => {
    const script = scripts.find((s) => s.id === id);
    if (!script) return;
    const newVal = !script.is_favorite;
    const { error } = await supabase
      .from("saved_scripts")
      .update({ is_favorite: newVal })
      .eq("id", id);
    if (error) throw error;
    setScripts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_favorite: newVal } : s))
    );
  };

  const toggleArchive = async (id: string) => {
    const script = scripts.find((s) => s.id === id);
    if (!script) return;
    const newVal = !script.is_archived;
    const { error } = await supabase
      .from("saved_scripts")
      .update({ is_archived: newVal })
      .eq("id", id);
    if (error) throw error;
    setScripts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_archived: newVal } : s))
    );
    // Recalculate stats
    await fetchScripts();
  };

  return { scripts, loading, stats, saveScript, deleteScript, toggleFavorite, toggleArchive, refetch: fetchScripts };
}
