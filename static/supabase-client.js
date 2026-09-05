/**
 * agtechdesigne STUDIO (AGOS Pict) — Supabase Client & State Synchronization
 * Gestione Auth (Google OAuth), Profili, Impostazioni Utente, Creazioni e Template di Branding.
 */
(() => {
  'use strict';

  const SUPABASE_URL = "https://mkeykuouwsbjezdgwskq.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_70iLuSDY3WwNRkGlVlHglQ_e2knWasO";

  let client = null;
  let currentUser = null;
  let currentProfile = null;
  let currentSettings = null;

  // Inizializzazione Client Supabase
  function getClient() {
    if (!client && window.supabase && window.supabase.createClient) {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    }
    return client;
  }

  // Auth: Login con Google OAuth
  async function signInWithGoogle() {
    const sb = getClient();
    if (!sb) {
      alert("Libreria Supabase non inizializzata.");
      return;
    }
    const { data, error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) {
      console.error("[SUPABASE] Errore Login Google:", error);
      alert("Errore durante il login con Google: " + error.message);
    }
    return { data, error };
  }

  // Auth: Logout
  async function signOut() {
    const sb = getClient();
    if (!sb) return;
    const { error } = await sb.auth.signOut();
    if (error) {
      console.error("[SUPABASE] Errore Logout:", error);
    } else {
      currentUser = null;
      currentProfile = null;
      currentSettings = null;
      window.location.reload();
    }
  }

  // Recupera profilo utente
  async function fetchProfile(userId) {
    const sb = getClient();
    if (!sb || !userId) return null;
    try {
      const { data, error } = await sb
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.warn("[SUPABASE] Errore recupero profilo:", error.message);
        return null;
      }
      currentProfile = data;
      return data;
    } catch (e) {
      console.error("[SUPABASE] Exception recupero profilo:", e);
      return null;
    }
  }

  // Aggiorna profilo utente (es. display_name, bio)
  async function updateProfile(userId, updates) {
    const sb = getClient();
    if (!sb || !userId) return null;
    try {
      const { data, error } = await sb
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      currentProfile = data;
      return data;
    } catch (e) {
      console.error("[SUPABASE] Errore aggiornamento profilo:", e);
      return null;
    }
  }

  // Recupera impostazioni utente
  async function fetchUserSettings(userId) {
    const sb = getClient();
    if (!sb || !userId) return null;
    try {
      const { data, error } = await sb
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (!error && data) {
        currentSettings = data;
        return data;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Aggiorna impostazioni utente (es. modello preferito, ratio default)
  async function updateUserSettings(userId, settings) {
    const sb = getClient();
    if (!sb || !userId) return null;
    try {
      const { data, error } = await sb
        .from('user_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      currentSettings = data;
      return data;
    } catch (e) {
      console.error("[SUPABASE] Errore salvataggio impostazioni:", e);
      return null;
    }
  }

  // Salva una creazione generata nella galleria Supabase
  async function saveCreation(creationData) {
    const sb = getClient();
    if (!sb) return { error: "Client non pronto" };
    if (!currentUser) return { error: "Effettua il login per salvare la creazione nel tuo profilo" };

    try {
      const { data, error } = await sb
        .from('creations')
        .insert([{
          user_id: currentUser.id,
          prompt: creationData.prompt,
          model: creationData.model || 'auto-router',
          provider: creationData.provider || '',
          ratio: creationData.ratio || '1:1',
          image_url: creationData.imageUrl,
          meta: creationData.meta || {},
          credits_used: creationData.creditsUsed || 0,
          is_favorite: Boolean(creationData.isFavorite)
        }])
        .select()
        .single();
      return { data, error };
    } catch (e) {
      return { error: e.message };
    }
  }

  // Recupera le creazioni salvate dell'utente
  async function fetchUserCreations(userId) {
    const sb = getClient();
    if (!sb || !userId) return [];
    try {
      const { data, error } = await sb
        .from('creations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("[SUPABASE] Errore recupero creazioni:", e);
      return [];
    }
  }

  // Elimina una creazione salvata
  async function deleteCreation(creationId) {
    const sb = getClient();
    if (!sb) return false;
    try {
      const { error } = await sb
        .from('creations')
        .delete()
        .eq('id', creationId);
      return !error;
    } catch (e) {
      return false;
    }
  }

  // Recupera template di branding (sistema + personali)
  async function fetchBrandTemplates() {
    const sb = getClient();
    if (!sb) return [];
    try {
      const { data, error } = await sb
        .from('brand_templates')
        .select('*')
        .order('is_system', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("[SUPABASE] Errore recupero template di branding:", e);
      return [];
    }
  }

  // Salva nuovo template di branding personalizzato
  async function createBrandTemplate(template) {
    const sb = getClient();
    if (!sb || !currentUser) return { error: "Autenticazione richiesta" };
    try {
      const { data, error } = await sb
        .from('brand_templates')
        .insert([{
          user_id: currentUser.id,
          title: template.title,
          category: template.category || 'custom',
          prompt_template: template.promptTemplate,
          negative_prompt: template.negativePrompt || '',
          style_slug: template.styleSlug || '',
          preview_url: template.previewUrl || '',
          palette: template.palette || ["#050507", "#5D2EFF", "#00E7FF", "#D4A017", "#FF1E9E"],
          is_public: Boolean(template.isPublic),
          is_system: false
        }])
        .select()
        .single();
      return { data, error };
    } catch (e) {
      return { error: e.message };
    }
  }

  // Aggiorna saldo crediti (addebito per generazione o accredito bonus)
  async function syncCredits(userId, newCredits) {
    const sb = getClient();
    if (!sb || !userId) return null;
    try {
      const { data, error } = await sb
        .from('profiles')
        .update({ credits: newCredits, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select('credits')
        .single();
      if (!error && data) {
        if (currentProfile) currentProfile.credits = data.credits;
        return data.credits;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Esportazione oggetto globale agosSupabase
  window.agosSupabase = {
    getClient,
    signInWithGoogle,
    signOut,
    fetchProfile,
    updateProfile,
    fetchUserSettings,
    updateUserSettings,
    saveCreation,
    fetchUserCreations,
    deleteCreation,
    fetchBrandTemplates,
    createBrandTemplate,
    syncCredits,
    getUser: () => currentUser,
    getProfile: () => currentProfile,
    getSettings: () => currentSettings,
    setUser: (u) => { currentUser = u; },
    setProfile: (p) => { currentProfile = p; }
  };

})();
