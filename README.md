# WarLike Crypte

Application **autonome** de coffre chiffré local, indépendante de WarLike Server et WarLike Hub.

## Fonctions

- Création / déverrouillage d'un coffre avec phrase maîtresse de 12 caractères minimum.
- PBKDF2-SHA256 (600 000 itérations), sel aléatoire de 32 octets, chiffrement AES-GCM 256 bits et IV aléatoire de 12 octets pour chaque sauvegarde.
- Création, modification, recherche, suppression d'identifiants, générateur de mots de passe et copie explicite vers le presse-papiers.
- Rotation de phrase maîtresse : vérification de l'ancienne phrase, création d'une nouvelle clé PBKDF2, rechiffrement AES-GCM puis remplacement atomique de l'enveloppe locale.
- Import vérifié : déchiffrement préalable d'une sauvegarde avec sa phrase secrète et confirmation avant tout remplacement du coffre.
- Données stockées **chiffrées** dans le `localStorage` du navigateur. Export/import de sauvegardes chiffrées uniquement.
- Verrouillage à l'inactivité (2 minutes) ou si l'onglet passe en arrière-plan.
- Détection des modifications du coffre depuis un autre onglet et invalidation de la session courante pour prévenir les écritures concurrentes.
- Générateur paramétrable de 16 à 64 caractères, indicateur heuristique de robustesse et copie de l'identifiant.
- Protection contre certaines courses asynchrones entre chiffrement, verrouillage et changement de phrase maîtresse.
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

## Précautions concernant les nouvelles fonctions

La rotation change la clé du coffre actif uniquement ; les anciennes sauvegardes restent protégées par l'ancienne phrase maîtresse. Exporter une nouvelle sauvegarde immédiatement après rotation. L'import nécessite de connaître la phrase maîtresse de la sauvegarde ; il ne fusionne pas les entrées et remplace l'intégralité du coffre local après confirmation. L'application reste une expérimentation non auditée, sans sync cloud, ni récupération de phrase maîtresse.

## Vérifications conseillées avant production

1. Créer un coffre, enregistrer et modifier des entrées, recharger la page et vérifier le déverrouillage.
2. Ouvrir deux onglets du même domaine ; modifier le coffre dans le premier, vérifier que le second se verrouille.
3. Vérifier la fermeture de l'onglet, le passage en arrière-plan et le verrouillage après deux minutes d'inactivité.
4. Essayer les sauvegardes chiffrées, les mauvaises phrases maîtresses, les limites de fichiers et la rotation suivie d'un nouvel export.
5. Tester les permissions de presse-papiers, l'accessibilité clavier et l'affichage mobile.

Ces tests ne remplacent pas un audit cryptographique et de sécurité indépendant. Les indicateurs de robustesse ne garantissent pas qu'un mot de passe résiste à toutes les attaques.
