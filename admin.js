// ============================================
// CMD. — admin.js
// Login vendeur + dashboard (onglets, stats, graphique, produits, commandes)
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
async function chargerFAQAdmin() {
  const { data: faqs } = await supabaseClient
    .from('faq')
    .select('*')
    .eq('vendeur_id', vendeurConnecte.id)
    .order('ordre', { ascending: true });

  const liste = document.getElementById('liste-faq-admin');
  if (!liste) return;
  liste.innerHTML = '';

  if (!faqs || faqs.length === 0) {
    liste.innerHTML = '<p class="empty-state">Aucune question pour le moment.</p>';
    return;
  }

  faqs.forEach(f => {
    liste.innerHTML += `
      <div class="produit-row">
        <div class="produit-infos">
          <strong>${f.question}</strong>
          <span class="prix">${f.reponse}</span>
        </div>
        <div class="produit-actions">
          <button class="icon-btn danger" onclick="supprimerFAQ('${f.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  });
}

async function chargerAvisAModerer() {
  const { data: enAttente } = await supabaseClient
    .from('avis')
    .select('*')
    .eq('vendeur_id', vendeurConnecte.id)
    .eq('statut', 'en_attente')
    .order('date_creation', { ascending: false });

  const { data: approuves } = await supabaseClient
    .from('avis')
    .select('*')
    .eq('vendeur_id', vendeurConnecte.id)
    .eq('statut', 'approuve')
    .order('date_creation', { ascending: false })
    .limit(20);

  const listeAttente = document.getElementById('liste-avis-attente');
  const listeApprouves = document.getElementById('liste-avis-approuves');
  if (!listeAttente || !listeApprouves) return;

  listeAttente.innerHTML = (!enAttente || enAttente.length === 0)
    ? '<p class="empty-state">Aucun avis en attente.</p>'
    : enAttente.map(a => `
        <div class="commande-row">
          <strong>${a.nom_client}</strong> — ${'★'.repeat(a.note)}${'☆'.repeat(5 - a.note)}
          <br><small style="color:#999;">${a.commentaire || ''}</small>
          <div style="margin-top:8px; display:flex; gap:8px;">
            <button class="admin-btn" style="width:auto; padding:8px 14px;" onclick="modererAvis('${a.id}', 'approuve')">Approuver</button>
            <button class="admin-btn secondaire" style="width:auto; padding:8px 14px;" onclick="modererAvis('${a.id}', 'rejete')">Rejeter</button>
          </div>
        </div>
      `).join('');

      listeApprouves.innerHTML = (!approuves || approuves.length === 0)
      ? '<p class="empty-state">Aucun avis publié pour le moment.</p>'
      : approuves.map(a => `
          <div class="commande-row">
            <strong>${a.nom_client}</strong> — ${'★'.repeat(a.note)}${'☆'.repeat(5 - a.note)}
            <br><small style="color:#999;">${a.commentaire || ''}</small>
            <div style="margin-top:8px;">
              <button class="admin-btn secondaire" style="width:auto; padding:6px 12px; font-size:12px;" onclick="modererAvis('${a.id}', 'rejete')">Dépublier</button>
            </div>
          </div>
        `).join('');
  
}

async function modererAvis(id, statut) {
  await supabaseClient.from('avis').update({ statut }).eq('id', id);
  await chargerAvisAModerer();
}


async function ajouterFAQ() {
  const question = document.getElementById('nouvelle-faq-question').value.trim();
  const reponse = document.getElementById('nouvelle-faq-reponse').value.trim();
  const messageEl = document.getElementById('faq-message');

  if (!question || !reponse) {
    messageEl.textContent = "Question et réponse sont obligatoires.";
    messageEl.style.color = 'red';
    return;
  }

  const { error } = await supabaseClient.from('faq').insert({
    vendeur_id: vendeurConnecte.id, question, reponse
  });

  if (error) {
    messageEl.textContent = "Erreur lors de l'ajout.";
    messageEl.style.color = 'red';
    return;
  }

  messageEl.textContent = "Question ajoutée ✓";
  messageEl.style.color = 'green';
  document.getElementById('nouvelle-faq-question').value = '';
  document.getElementById('nouvelle-faq-reponse').value = '';
  await chargerFAQAdmin();
}

async function supprimerFAQ(id) {
  await supabaseClient.from('faq').delete().eq('id', id);
  await chargerFAQAdmin();
}


// ---- Navigation par onglets ----
function changerOnglet(nom, boutonEl) {
  document.querySelectorAll('.onglet-panel').forEach(p => p.classList.remove('actif'));
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('actif'));
  document.getElementById('onglet-' + nom).classList.add('actif');
  boutonEl.classList.add('actif');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function chargerDashboard(authUserId) {
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
  await chargerGraphique7Jours();
  await chargerProduits();
  await chargerCommandes();
  remplirInfosVendeur();
  chargerFAQAdmin();
  chargerAvisAModerer()

}

function remplirInfosVendeur() {
  document.getElementById('info-whatsapp').value = vendeurConnecte.numero_whatsapp || '';
  document.getElementById('info-wave').value = vendeurConnecte.wave_numero || '';
  document.getElementById('info-om').value = vendeurConnecte.om_numero || '';
}

async function enregistrerInfos() {
  const numero_whatsapp = document.getElementById('info-whatsapp').value.trim();
  const wave_numero = document.getElementById('info-wave').value.trim();
  const om_numero = document.getElementById('info-om').value.trim();
  const messageEl = document.getElementById('info-message');

  if (!numero_whatsapp) {
    messageEl.textContent = "Le numéro WhatsApp est obligatoire.";
    messageEl.style.color = 'red';
    return;
  }

  const { error } = await supabaseClient
    .from('vendeurs')
    .update({ numero_whatsapp, wave_numero, om_numero })
    .eq('id', vendeurConnecte.id);

  if (error) {
    messageEl.textContent = "Erreur lors de l'enregistrement.";
    messageEl.style.color = 'red';
    return;
  }

  vendeurConnecte.numero_whatsapp = numero_whatsapp;
  vendeurConnecte.wave_numero = wave_numero;
  vendeurConnecte.om_numero = om_numero;

  messageEl.textContent = "Informations mises à jour ✓";
  messageEl.style.color = 'green';
}

// ---- Stats principales (mois en cours + panier moyen + produit top) ----
async function chargerStats() {
  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  const { data: commandes } = await supabaseClient
    .from('commandes')
    .select('total, contenu')
    .eq('vendeur_id', vendeurConnecte.id)
    .gte('date_creation', debutMois.toISOString());

  const { count: nbProduits } = await supabaseClient
    .from('produits')
    .select('*', { count: 'exact', head: true })
    .eq('vendeur_id', vendeurConnecte.id)
    .eq('actif', true);

  const nbCommandes = commandes ? commandes.length : 0;
  const totalFcfa = commandes ? commandes.reduce((sum, c) => sum + c.total, 0) : 0;
  const panierMoyen = nbCommandes > 0 ? Math.round(totalFcfa / nbCommandes) : 0;

  document.getElementById('stat-commandes').textContent = nbCommandes;
  document.getElementById('stat-produits').textContent = nbProduits || 0;
  document.getElementById('stat-total').textContent = totalFcfa.toLocaleString();
  document.getElementById('stat-panier-moyen').textContent = panierMoyen.toLocaleString();

  // Produit le plus commandé, à partir du contenu (jsonb) des commandes du mois
  const compteurProduits = {};
  (commandes || []).forEach(c => {
    (c.contenu || []).forEach(item => {
      const nomItem = item.nom || item.name;
      const qte = item.quantite || item.qte || 1;
      if (!nomItem) return;
      compteurProduits[nomItem] = (compteurProduits[nomItem] || 0) + qte;
    });
  });

  const produitTopEl = document.getElementById('stat-produit-top');
  const entries = Object.entries(compteurProduits);
  if (entries.length === 0) {
    produitTopEl.textContent = '—';
  } else {
    entries.sort((a, b) => b[1] - a[1]);
    produitTopEl.textContent = entries[0][0];
  }
}

// ---- Mini graphique en barres : commandes des 7 derniers jours ----
async function chargerGraphique7Jours() {
  const jours = [];
  const debut = new Date();
  debut.setHours(0, 0, 0, 0);
  debut.setDate(debut.getDate() - 6);

  const { data: commandes } = await supabaseClient
    .from('commandes')
    .select('date_creation')
    .eq('vendeur_id', vendeurConnecte.id)
    .gte('date_creation', debut.toISOString());

  const compteurParJour = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(debut);
    d.setDate(debut.getDate() + i);
    const cle = d.toISOString().slice(0, 10);
    compteurParJour[cle] = 0;
    jours.push(cle);
  }

  (commandes || []).forEach(c => {
    const cle = c.date_creation.slice(0, 10);
    if (compteurParJour[cle] !== undefined) compteurParJour[cle]++;
  });

  const max = Math.max(1, ...Object.values(compteurParJour));
  const conteneur = document.getElementById('chart-7jours');
  conteneur.innerHTML = '';

  const nomsJours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  jours.forEach(cle => {
    const val = compteurParJour[cle];
    const d = new Date(cle);
    const hauteur = Math.round((val / max) * 100);
    conteneur.innerHTML += `
      <div class="chart-bar-col">
        <div class="chart-bar-val">${val > 0 ? val : ''}</div>
        <div class="chart-bar" style="height:${Math.max(hauteur, 3)}%;"></div>
        <div class="chart-bar-label">${nomsJours[d.getDay()]}</div>
      </div>
    `;
  });
}

// ---- Produits (avec miniature photo) ----
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
    liste.innerHTML = '<p class="empty-state">Aucun produit pour le moment.</p>';
    return;
  }

  produits.forEach(p => {
    const imgSrc = p.image_url || '';
    liste.innerHTML += `
      <div class="produit-row">
        ${imgSrc
          ? `<img src="${imgSrc}" class="produit-thumb" alt="${p.nom}">`
          : `<div class="produit-thumb" style="display:flex;align-items:center;justify-content:center;color:#ccc;"><i class="fa-solid fa-image"></i></div>`}
        <div class="produit-infos">
          <strong>${p.nom}</strong>
          <span class="prix">${p.prix.toLocaleString()} FCFA · ${p.categorie}</span>
        </div>
        <div class="produit-actions">
          <button class="icon-btn ${p.favori ? 'favori-actif' : ''}" title="${p.favori ? 'Retirer de la une' : 'Mettre en avant'}" onclick="basculerFavori('${p.id}', ${p.favori})">
            <i class="fa-solid fa-star"></i>
          </button>
          <button class="icon-btn danger" title="Retirer du site" onclick="supprimerProduit('${p.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  });
}

async function ajouterProduit() {
  const nom = document.getElementById('nouveau-nom').value;
  const prix = parseInt(document.getElementById('nouveau-prix').value);
  const fichier = document.getElementById('nouveau-image-fichier').files[0];
  const categorie = document.getElementById('nouveau-categorie').value || 'general';
  const favori = document.getElementById('nouveau-favori').checked;
  const messageEl = document.getElementById('produit-message');

  if (!nom || !prix) {
    messageEl.textContent = "Nom et prix sont obligatoires.";
    messageEl.style.color = 'red';
    return;
  }

  let image_url = '';

  if (fichier) {
    messageEl.textContent = "Envoi de la photo en cours...";
    messageEl.style.color = '#777';

    const nomFichier = `${vendeurConnecte.id}/${Date.now()}-${fichier.name}`;

    const { error: erreurUpload } = await supabaseClient
      .storage
      .from('produits-images')
      .upload(nomFichier, fichier);

    if (erreurUpload) {
      messageEl.textContent = "Erreur lors de l'envoi de la photo.";
      messageEl.style.color = 'red';
      return;
    }

    const { data: urlData } = supabaseClient
      .storage
      .from('produits-images')
      .getPublicUrl(nomFichier);

    image_url = urlData.publicUrl;
  }

  const { error } = await supabaseClient.from('produits').insert({
    vendeur_id: vendeurConnecte.id,
    nom, prix, image_url, categorie, favori
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
  document.getElementById('nouveau-image-fichier').value = '';
  document.getElementById('nouveau-categorie').value = '';
  document.getElementById('nouveau-favori').checked = false;

  await chargerProduits();
  await chargerStats();
}

async function basculerFavori(id, etatActuel) {
  await supabaseClient.from('produits').update({ favori: !etatActuel }).eq('id', id);
  await chargerProduits();
}

async function supprimerProduit(id) {
  await supabaseClient.from('produits').update({ actif: false }).eq('id', id);
  await chargerProduits();
  await chargerStats();
}

// ---- Commandes : version courte (dashboard) + version complète (onglet Commandes) ----
async function chargerCommandes() {
  const { data: commandes } = await supabaseClient
    .from('commandes')
    .select('*')
    .eq('vendeur_id', vendeurConnecte.id)
    .order('date_creation', { ascending: false })
    .limit(5);

  afficherListeCommandes(commandes, 'liste-commandes-admin');

  // Version complète (jusqu'à 50) pour l'onglet dédié
  const { data: commandesCompletes } = await supabaseClient
    .from('commandes')
    .select('*')
    .eq('vendeur_id', vendeurConnecte.id)
    .order('date_creation', { ascending: false })
    .limit(50);

  afficherListeCommandes(commandesCompletes, 'liste-commandes-complete');
}

function afficherListeCommandes(commandes, idConteneur) {
  const liste = document.getElementById(idConteneur);
  liste.innerHTML = '';

  if (!commandes || commandes.length === 0) {
    liste.innerHTML = '<p class="empty-state">Aucune commande pour le moment.</p>';
    return;
  }

  commandes.forEach(c => {
    const date = new Date(c.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    liste.innerHTML += `
      <div class="commande-row">
        <span class="total">${c.total.toLocaleString()} FCFA</span>
        <strong>${c.nom_client} ${c.prenom_client}</strong>
        <span class="badge-statut">${c.statut}</span>
        <br><small style="color:#999;">${date} · ${c.numero_client}</small>
      </div>
    `;
  });
}