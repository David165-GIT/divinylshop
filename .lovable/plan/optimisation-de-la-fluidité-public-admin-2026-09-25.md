# Optimisation de la fluidité (public + admin)

## Constat
- Partie publique déjà bien optimisée : pages chargées à la demande, catalogue affiché par lots, cache local, images WebP.
- Point lourd : l'illustration « Approvisionnement en cours » pèse 1,5 Mo (PNG) — ralentit les sections vides, surtout sur mobile.
- Admin : la page admin charge **tous** les articles d'un coup et affiche toutes les cartes en même temps ; plus le stock grandit, plus la page rame (recherche, défilement, saisie).
- Images de l'admin (liste) : pas de dimensions fixées → petits sauts à l'affichage.

## Propositions
1. **Illustration vide** : conversion en WebP ~600×600 (≈ 60–100 Ko au lieu de 1,5 Mo).
2. **Admin – affichage progressif** : afficher les cartes par lots de 60 au défilement (comme le catalogue public).
3. **Admin – recherche fluide** : léger délai (200 ms) sur la barre de recherche pour ne pas recalculer la liste à chaque touche.
4. **Admin – images** : dimensions explicites + chargement asynchrone pour éviter les sauts.
5. **Chargement anticipé** : précharger la page catalogue au survol des liens du menu, pour une ouverture quasi instantanée.

## Détails techniques
- `sharp`/ffmpeg → `public/approvisionnement.webp`, mise à jour `Catalogue.tsx` et `EditionsOriginales.tsx`.
- `AdminPanel.tsx` : `visibleCount` + `IntersectionObserver`, `useDeferredValue` sur la recherche, `useMemo` sur le filtrage, `width/height/decoding="async"` sur les `<img>`.
- Préchargement : appel `import("./pages/Catalogue.tsx")` sur `onMouseEnter`/`onTouchStart` des liens de navigation.
- Aucune modification de la logique métier ni des données.
