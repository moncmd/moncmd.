// ============================================
// CMD. — script.js (version Supabase multi-vendeur)
// ============================================

let produits = [];
let vendeurActuel = null;

async function chargerBoutique() {
  const debutChargement = Date.now();
  const slug = getVendeurSlug();

  const { data: vendeur, error: errVendeur } = await supabaseClient
    .from('vendeurs')
    .select('*')
    .eq('slug', slug)
    .eq('actif', true)
    .single();

  if (errVendeur || !vendeur) {
    document.querySelector('main').innerHTML = `
      <p style="text-align:center; padding: 60px 20px;">
        Cette boutique n'est pas disponible pour le moment.
      </p>`;
    cacherEcranChargement(debutChargement);
    return;
  }

  vendeurActuel = vendeur;
  appliquerIdentiteVendeur(vendeur);

  const { data: produitsData, error: errProduits } = await supabaseClient
    .from('produits')
    .select('*')
    .eq('vendeur_id', vendeur.id)
    .eq('actif', true);

  if (errProduits) {
    console.error('Erreur chargement produits :', errProduits);
    return;
  }

  produits = produitsData || [];
  genererCards();
  mettreAJourCompteur();
  remplirPaiement();
  cacherEcranChargement(debutChargement);

  // Si on est sur la page commande, le résumé ne peut être affiché
  // qu'une fois les produits chargés depuis Supabase
  if (typeof afficherResume === 'function') afficherResume();
}

// Fait disparaître l'écran de chargement en fondu, après au moins ~900ms
// (pour que le logo CMD. ait le temps d'être visible, même si le chargement est instantané)
function cacherEcranChargement(debutChargement) {
  const ecran = document.getElementById('ecran-chargement');
  if (!ecran) return;

  const dureeMin = 900;
  const ecoule = Date.now() - (debutChargement || Date.now());
  const attente = Math.max(0, dureeMin - ecoule);

  setTimeout(() => {
    ecran.style.opacity = '0';
    setTimeout(() => ecran.remove(), 400);
  }, attente);
}

function appliquerIdentiteVendeur(vendeur) {
  document.querySelectorAll('.logo h5').forEach(el => el.textContent = vendeur.nom_boutique);
  document.documentElement.style.setProperty('--couleur-accent', vendeur.couleur_accent || '#e56400');

  const lienWhatsapp = document.querySelector('a[href*="wa.me"]');
  if (lienWhatsapp) {
    lienWhatsapp.href = `https://wa.me/${vendeur.numero_whatsapp}?text=Bonjour, je voudrais passer une commande !`;
  }
}

function remplirPaiement() {
  if (!vendeurActuel) return;
  const waveEl = document.getElementById('wave-numero');
  const omEl = document.getElementById('om-numero');
  if (waveEl) waveEl.textContent = vendeurActuel.wave_numero || '—';
  if (omEl) omEl.textContent = vendeurActuel.om_numero || '—';
}

function genererCards() {
  const boutonsContainer = document.getElementById('categories-boutons');
  const produitsContainer = document.getElementById('categories-produits');
  if (!boutonsContainer || !produitsContainer) return; // pas sur cette page (ex: commande.html)

  boutonsContainer.innerHTML = '';
  produitsContainer.innerHTML = '';

  // 1. Trouver les catégories réellement utilisées par ce vendeur, dans l'ordre d'apparition
  const categories = [];
  produits.forEach(p => {
    const cat = p.categorie || 'general';
    if (!categories.includes(cat)) categories.push(cat);
  });

  if (categories.length === 0) {
    produitsContainer.innerHTML = '<p style="text-align:center; padding:40px 20px; color:#999;">Aucun produit pour le moment.</p>';
    return;
  }

  // 2. Générer un bouton par catégorie
  categories.forEach((cat, index) => {
    const div = document.createElement('div');
    div.classList.add('selectt');
    div.innerHTML = `<button class="menu-btn${index === 0 ? ' active' : ''}" data-cat="${cat}" onclick="afficherCategorie('${cat}', this)">${formaterNomCategorie(cat)}</button>`;
    boutonsContainer.appendChild(div);
  });

  // 3. Générer un conteneur de produits (carrousel) par catégorie
  categories.forEach((cat, index) => {
    const section = document.createElement('div');
    section.classList.add('categorie-section');
    section.dataset.cat = cat;
    section.style.display = index === 0 ? 'block' : 'none';

    section.innerHTML = `
      <div class="splide" role="group">
        <div class="splide__track">
          <ul class="splide__list"></ul>
        </div>
      </div>
    `;
    produitsContainer.appendChild(section);

    const liste = section.querySelector('.splide__list');
    const produitsCategorie = produits
      .filter(p => (p.categorie || 'general') === cat)
      .sort((a, b) => (b.favori === true) - (a.favori === true)); // favoris en premier

    produitsCategorie.forEach(produit => {
      const li = document.createElement('li');
      li.classList.add('splide__slide');
      li.innerHTML = `
        <div class="product-card">
            ${produit.favori ? '<span class="badge-favori">★ Populaire</span>' : ''}
            <img src="${produit.image_url}" alt="${produit.nom}">
            <p class="produit">${produit.nom}</p>
            <p class="prix">${produit.prix} FCFA</p>
            <a href="panier.html?id=${produit.id}">Voir</a>
            <a href="javascript:void(0)" onclick="ajouterAuPanier('${produit.id}')">Ajouter au panier</a>
        </div>
      `;
      liste.appendChild(li);
    });
  });

  // 4. Monter Splide sur chaque carrousel généré
  document.querySelectorAll('.splide').forEach(slider => {
    if (slider.splide) slider.splide.destroy(true);
    const instance = new Splide(slider, {
      perPage: 3,
      gap: '20px',
      arrows: false,
      pagination: false,
      breakpoints: { 1024: { perPage: 2 }, 600: { perPage: 1 } }
    });
    instance.mount();
    slider.splide = instance;
  });
}

// Transforme "jus" -> "Jus", "plats_chauds" -> "Plats chauds"
function formaterNomCategorie(cat) {
  return cat.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
}

// Bascule l'affichage entre catégories
function afficherCategorie(cat, bouton) {
  document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
  bouton.classList.add('active');

  document.querySelectorAll('.categorie-section').forEach(section => {
    section.style.display = section.dataset.cat === cat ? 'block' : 'none';
  });
}

// ============================================
// Panier (LocalStorage, propre à ce navigateur)
// ============================================
let panierData = JSON.parse(localStorage.getItem('panier')) || [];

function mettreAJourCompteur() {
  let total = 0;
  panierData.forEach(p => total += p.quantite);
  if (document.getElementById('compteur')) {
    document.getElementById('compteur').textContent = total;
  }
}

function animation() {
  const toast = document.createElement('div');
  toast.innerHTML = `Produit ajouté ✓`;
  toast.classList.add('toast');
  document.body.appendChild(toast);
  setTimeout(() => document.body.removeChild(toast), 2000);
}

function ajouterAuPanier(id, commentaire = "") {
  animation();

  let item = panierData.find(p => p.id === id);
  if (item) {
    item.quantite++;
    item.commentaire = commentaire;
  } else {
    panierData.push({ id, quantite: 1, commentaire });
  }

  localStorage.setItem('panier', JSON.stringify(panierData));
  mettreAJourCompteur();
}

document.addEventListener('DOMContentLoaded', chargerBoutique);
