
  
  
  
const params = new URLSearchParams(window.location.search);
const id = parseInt(params.get('id'));

if (id) {
  const produit = produits.find(p => p.id === id);
  
  document.querySelector('.left img').src = produit.image;
  document.querySelector('.left img').alt = produit.nom;
  document.querySelector('.right .nom').textContent = produit.nom;
  document.querySelector('.right .description').textContent = produit.description;
  document.querySelector('.right .prix').textContent = produit.prix + ' FCFA';
  
  document.getElementById('btn-acheter').onclick = function() {
    const commentaire = document.querySelector('textarea').value;
    ajouterAuPanier(produit.id, commentaire);
}

}