let panier = document.getElementById("panier");

function fermerPanier() {
    panier.classList.remove('ouvert');
}

function voirpanier() {
    panier.classList.toggle('ouvert');
    afficherContenuPanier();
}

function afficherContenuPanier() {
    panier.innerHTML = `<button onclick="fermerPanier()" class="toggle">✕</button>`;

    if (panierData.length === 0) {
        panier.innerHTML += `<p class="vide">Votre panier est vide 🛒</p>`;
        return;
    }
    

    panierData.forEach((item, index) => {
        let produit = produits.find(p => p.id === item.id);

        panier.innerHTML += `
        <div class="pan"> 
            <div class="top">
                <div class="image">
                    <img src="${produit.image}">
                </div>
                <div class="details">
                    <h4>${produit.nom}</h4>
               <p>${produit.prix * item.quantite} FCFA</p>

                </div>
            </div>
            <div class="bottom">
                <span class="countt">${item.quantite}</span>
                <button onclick="ajouter(${index})">+</button>
                <button onclick="supprimer(${index})">-</button>
            </div>
        </div>
        `;
    });
    let total = 0;
    panierData.forEach(item => {
        let produit = produits.find(p => p.id === item.id);
        total += produit.prix * item.quantite;
    });

    panier.innerHTML += `<p class="total">Total : ${total} FCFA</p>`;

    panier.innerHTML += `
    <a href="commande.html" class="gg">Confirmer la commande</a>
`;

}


function ajouter(index) {
    panierData[index].quantite++;
    localStorage.setItem('panier', JSON.stringify(panierData));
    afficherContenuPanier();
}

function supprimer(index) {
    if (panierData[index].quantite > 1) {
        panierData[index].quantite--;
    } else {
        panierData.splice(index, 1);
    }
    localStorage.setItem('panier', JSON.stringify(panierData));
    afficherContenuPanier();
}
