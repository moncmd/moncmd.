// ============================================
// CMD. — script.js (version Supabase multi-vendeur)
// ============================================

let produits = [];
let vendeurActuel = null;

async function chargerBoutique() {
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

  // Si on est sur la page commande, le résumé ne peut être affiché
  // qu'une fois les produits chargés depuis Supabase
  if (typeof afficherResume === 'function') afficherResume();
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
  const listeCrepes = document.querySelector('.crêpes .splide__list');
  const listeJus = document.querySelector('.juslocaux .splide__list');
  if (listeCrepes) listeCrepes.innerHTML = '';
  if (listeJus) listeJus.innerHTML = '';

  produits.forEach(produit => {
    const li = document.createElement('li');
    li.classList.add('splide__slide');

    li.innerHTML = `
    <div class="product-card">
        <img src="${produit.image_url}" alt="${produit.nom}">
        <p class="produit">${produit.nom}</p>
        <p class="prix">${produit.prix} FCFA</p>
        <a href="panier.html?id=${produit.id}">Voir</a>
        <a href="javascript:void(0)" onclick="ajouterAuPanier('${produit.id}')">Ajouter au panier</a>
    </div>
    `;

    if (produit.categorie === 'crepes' && listeCrepes) {
      listeCrepes.appendChild(li);
    } else if (listeJus) {
      listeJus.appendChild(li);
    }
  });

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
