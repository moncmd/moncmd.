-- ============================================
-- CMD. — Schéma de base de données Supabase
-- ============================================

create table vendeurs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nom_boutique text not null,
  numero_whatsapp text not null,
  couleur_accent text default '#e56400',
  logo_url text,
  wave_numero text,
  om_numero text,
  actif boolean default true,
  date_creation timestamp default now()
);

create table produits (
  id uuid primary key default gen_random_uuid(),
  vendeur_id uuid references vendeurs(id) on delete cascade,
  nom text not null,
  prix integer not null,
  image_url text,
  categorie text default 'general',
  description text,
  favori boolean default false,           -- mis en avant par le vendeur (produit populaire)
  actif boolean default true,
  date_creation timestamp default now()
);

create table commandes (
  id uuid primary key default gen_random_uuid(),
  vendeur_id uuid references vendeurs(id) on delete cascade,
  nom_client text,
  prenom_client text,
  numero_client text,
  adresse text,
  heure_recuperation text,
  mode_paiement text,
  contenu jsonb not null,
  total integer not null,
  statut text default 'nouvelle',
  date_creation timestamp default now()
);

create table admins (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null,
  vendeur_id uuid references vendeurs(id) on delete cascade
);

alter table vendeurs enable row level security;
alter table produits enable row level security;
alter table commandes enable row level security;
alter table admins enable row level security;

create policy "Lecture publique vendeurs actifs" on vendeurs
  for select using (actif = true);

create policy "Vendeur modifie ses propres informations" on vendeurs
  for update using (
    id in (select vendeur_id from admins where auth_user_id = auth.uid())
  );

create policy "Lecture publique produits actifs" on produits
  for select using (actif = true);

create policy "Creation publique commandes" on commandes
  for insert with check (true);

create policy "Admin lit sa propre ligne" on admins
  for select using (auth_user_id = auth.uid());

create policy "Vendeur voit ses commandes" on commandes
  for select using (
    vendeur_id in (select vendeur_id from admins where auth_user_id = auth.uid())
  );

create policy "Vendeur gere ses produits" on produits
  for all using (
    vendeur_id in (select vendeur_id from admins where auth_user_id = auth.uid())
  );

insert into vendeurs (slug, nom_boutique, numero_whatsapp, wave_numero, om_numero)
values ('demo', 'CMD Démo', '221784218267', '784218267', '775683106');

-- ============================================
-- MIGRATION : si tu as déjà exécuté ce script une première fois,
-- exécute seulement la ligne suivante pour ajouter le champ favori
-- (sans rien recréer, sans perdre tes données existantes)
-- ============================================
-- alter table produits add column if not exists favori boolean default false;
--
-- create policy "Vendeur modifie ses propres informations" on vendeurs
--   for update using (
--     id in (select vendeur_id from admins where auth_user_id = auth.uid())
--   );
