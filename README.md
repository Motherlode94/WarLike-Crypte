# WarLike Crypte

Application **autonome** de coffre chiffré local, indépendante de WarLike Server et WarLike Hub.

## Fonctions

- Création / déverrouillage d'un coffre avec phrase maîtresse de 12 caractères minimum.
- PBKDF2-SHA256 (600 000 itérations), sel aléatoire de 32 octets, chiffrement AES-GCM 256 bits et IV aléatoire de 12 octets pour chaque sauvegarde.
- Création, modification, recherche, suppression d'identifiants, générateur de mots de passe et copie explicite vers le presse-papiers.
- Données stockées **chiffrées** dans le `localStorage` du navigateur. Export/import de sauvegardes chiffrées uniquement.
- Verrouillage à l'inactivité (2 minutes) ou si l'onglet passe en arrière-plan.
- Interface locale sans API, backend, services externes ou appels réseau ; Content Security Policy restreinte.

## Déploiement

Site statique : publier la racine du dépôt sur Cloudflare Pages, GitHub Pages, ou exécuter :

```sh
python -m http.server 8080
```

## Limites importantes

**Version expérimentale non auditée.** Ne pas l'utiliser comme unique sauvegarde de mots de passe importants ou comme remplacement d'un gestionnaire de mots de passe éprouvé. La récupération de la phrase maîtresse est impossible ; conserver des sauvegardes chiffrées et votre phrase maîtresse. Les données ne sont pas synchronisées entre appareils. La sécurité dépend aussi de l'intégrité du navigateur et des fichiers servis. Le presse-papiers reste sous le contrôle du système.

## Organisation

`index.html`, `style.css`, `app.js` — application autonome sans dépendance JavaScript externe.
