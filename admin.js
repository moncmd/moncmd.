// ============================================
// CMD. — admin.js
// Login vendeur + dashboard (stats, produits, commandes)
// ============================================

let vendeurConnecte = null;

document.addEventListener('DOMContentLoaded', verifierSession);

async function verifierSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    await chargerDashboard(session.user.id);
  }
}

async function connexion() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const erreurEl = document.getElementById('login-erreur');
  erreurEl.textContent = '';

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    erreurEl.textContent = "Email ou mot de passe incorrect.";
    return;
  }

  await chargerDashboard(data.user.id);
}

async function deconnexion() {
  await supabaseClient.auth.signOut();
  document.getElementById('vue-login').style.display = 'block';
  document.getElementById('vue-dashboard').style.display = 'none';
}

async function chargerDashboard(authUserId) {
  // Trouver le vendeur lié à ce compte admin
  const { data: admin, error: errAdmin } = await supabaseClient
    .from('admins')
    .select('vendeur_id, vendeurs(*)')
    .eq('auth_user_id', authUserId)
    .single();

  if (errAdmin || !admin) {
    document.getElementById('login-erreur').textContent = "Aucune boutique liée à ce compte.";
    return;
  }

  vendeurConnecte = admin.vendeurs;

  document.getElementById('vue-login').style.display = 'none';
  document.getElementById('vue-dashboard').style.display = 'block';
  document.getElementById('nom-boutique-admin').textContent = vendeurConnecte.nom_boutique;
  document.documentElement.style.setProperty('--couleur-accent', vendeurConnecte.couleur_accent || '#e56400');

  await chargerStats();
  await chargerProduits();
  await chargerCommandes();
}

async function chargerStats() {
  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  const { data: commandes } = await supabaseClient
    .from('commandes')
    .select('total')
    .eq('vendeur_id', vendeurConnecte.id)
    .gte('date_creation', debutMois.toISOString());

  const { count: nbProduits } = await supabaseClient
    .from('produits')
    .select('*', { count: 'exact', head: true })
    .eq('vendeur_id', vendeurConnecte.id)
    .eq('actif', true);

  const nbCommandes = commandes ? commandes.length : 0;
  const totalFcfa = commandes ? commandes.reduce((sum, c) => sum + c.total, 0) : 0;

  document.getElementById('stat-commandes').textContent = nbCommandes;
  document.getElementById('stat-produits').textContent = nbProduits || 0;
  document.getElementById('stat-total').textContent = totalFcfa.toLocaleString();
}

async function chargerProduits() {
  const { data: produits } = await supabaseClient
    .from('produits')
    .select('*')
    .eq('vendeur_id', vendeurConnecte.id)
    .eq('actif', true)
    .order('date_creation', { ascending: false });

  const liste = document.getElementById('liste-produits-admin');
  liste.innerHTML = '';

  if (!produits || produits.length === 0) {
    liste.innerHTML = '<p style="color:#999;">Aucun produit pour le moment.</p>';
    return;
  }

  produits.forEach(p => {
    liste.innerHTML += `
      <div class="commande-row">
        <strong>${p.nom}</strong> — ${p.prix} FCFA
        <span class="badge-statut">${p.categorie}</span>
        <a href="javascript:void(0)" onclick="supprimerProduit('${p.id}')" style="float:right; color:red;">Retirer</a>
      </div>
    `;
  });
}

async function ajouterProduit() {
  const nom = document.getElementById('nouveau-nom').value;
  const prix = parseInt(document.getElementById('nouveau-prix').value);
  const image_url = document.getElementById('nouveau-image').value;
  const categorie = document.getElementById('nouveau-categorie').value || 'general';
  const messageEl = document.getElementById('produit-message');

  if (!nom || !prix) {
    messageEl.textContent = "Nom et prix sont obligatoires.";
    messageEl.style.color = 'red';
    return;
  }

  const { error } = await supabaseClient.from('produits').insert({
    vendeur_id: vendeurConnecte.id,
    nom, prix, image_url, categorie
  });

  if (error) {
    messageEl.textContent = "Erreur lors de l'ajout.";
    messageEl.style.color = 'red';
    return;
  }

  messageEl.textContent = "Produit ajouté ✓";
  messageEl.style.color = 'green';
  document.getElementById('nouveau-nom').value = '';
  document.getElementById('nouveau-prix').value = '';
  document.getElementById('nouveau-image').value = '';
  document.getElementById('nouveau-categorie').value = '';

  await chargerProduits();
  await chargerStats();
}

async function supprimerProduit(id) {
  // On désactive plutôt que supprimer, pour garder l'historique des commandes cohérent
  await supabaseClient.from('produits').update({ actif: false }).eq('id', id);
  await chargerProduits();
  await chargerStats();
}

async function chargerCommandes() {
  const { data: commandes } = await supabaseClient
    .from('commandes')
    .select('*')
    .eq('vendeur_id', vendeurConnecte.id)
    .order('date_creation', { ascending: false })
    .limit(10);

  const liste = document.getElementById('liste-commandes-admin');
  liste.innerHTML = '';

  if (!commandes || commandes.length === 0) {
    liste.innerHTML = '<p style="color:#999;">Aucune commande pour le moment.</p>';
    return;
  }

  commandes.forEach(c => {
    const date = new Date(c.date_creation).toLocaleDateString('fr-FR');
    liste.innerHTML += `
      <div class="commande-row">
        <strong>${c.nom_client} ${c.prenom_client}</strong> — ${c.total} FCFA
        <span class="badge-statut">${c.statut}</span>
        <br><small style="color:#999;">${date} · ${c.numero_client}</small>
      </div>
    `;
  });
}
