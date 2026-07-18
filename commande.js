// Mode paiement
let modePaiementActuel = 'surplace';

function modePaiement(mode, bouton) {
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    bouton.classList.add('active');
    modePaiementActuel = mode;

    if (mode === 'online') {
        document.querySelector('.paiement').style.display = 'flex';
    } else {
        document.querySelector('.paiement').style.display = 'none';
    }
}

// Afficher le résumé
function afficherResume() {
    const resume = document.getElementById('resume');
    if (!resume) return;
    resume.innerHTML = "";

    let total = 0;

    panierData.forEach(item => {
        const produit = produits.find(p => p.id === item.id);
        if (!produit) return;
        const sousTotal = produit.prix * item.quantite;
        total += sousTotal;

        resume.innerHTML += `
            <div class="resume-item" style="display:flex; gap:12px; align-items:center; margin-bottom:12px;">
                <img src="${produit.image_url}" alt="${produit.nom}" style="width:50px; height:50px; object-fit:cover; border-radius:8px; flex-shrink:0;">
                <div>
                    <p>${produit.nom} x${item.quantite}</p>
                    ${item.commentaire ? `<p class="commentaire">💬 ${item.commentaire}</p>` : ''}
                    <p>${sousTotal} FCFA</p>
                </div>
            </div>
        `;
    });

    resume.innerHTML += `<p class="total">Total : ${total} FCFA</p>`;
}

// Envoyer sur WhatsApp (+ enregistrer la commande dans Supabase)
async function envoyerCommande() {
    const nom = document.getElementById('nom').value;
    const prenom = document.getElementById('prenom').value;
    const numero = document.getElementById('numero').value;
    const adresse = document.getElementById('adresse').value;
    const heure = document.getElementById('heure').value;

    if (!nom || !prenom || !numero) {
        alert('Veuillez remplir tous les champs !');
        return;
    }

    if (!vendeurActuel) {
        alert("Erreur : boutique non chargée. Rechargez la page.");
        return;
    }

    let message = `Bonjour, voici ma commande :\n\n`;
    let total = 0;
    const contenu = [];

    panierData.forEach(item => {
        const produit = produits.find(p => p.id === item.id);
        if (!produit) return;
        const sousTotal = produit.prix * item.quantite;
        total += sousTotal;
        message += `- ${produit.nom} x${item.quantite} → ${sousTotal} FCFA`;
        if (item.commentaire) message += ` (${item.commentaire})`;
        message += `\n`;

        contenu.push({
            produit: produit.nom,
            quantite: item.quantite,
            prix: produit.prix,
            commentaire: item.commentaire || ""
        });
    });

    message += `\nTotal : ${total} FCFA`;
    message += `\n\nNom : ${nom} ${prenom}`;
    message += `\nNuméro : ${numero}`;
    if (adresse) message += `\nAdresse : ${adresse}`;
    message += `\nHeure de récupération : ${heure}`;

    // Enregistrement dans Supabase avant l'ouverture de WhatsApp
    const { error } = await supabaseClient.from('commandes').insert({
        vendeur_id: vendeurActuel.id,
        nom_client: nom,
        prenom_client: prenom,
        numero_client: numero,
        adresse: adresse,
        heure_recuperation: heure,
        mode_paiement: modePaiementActuel,
        contenu: contenu,
        total: total
    });

    if (error) {
        console.error('Erreur enregistrement commande :', error);
        // On n'empêche pas la commande WhatsApp même si l'enregistrement échoue
    }

    const url = `https://wa.me/${vendeurActuel.numero_whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    localStorage.removeItem('panier');
    panierData = [];
    if (document.getElementById('compteur')) {
        document.getElementById('compteur').textContent = 0;
    }
}
