# Déploiement sur un VPS

Deux montages coexistent dans ce dépôt. **Le premier est celui en service**,
le second est documenté comme alternative.

| | En service | Alternative |
|---|---|---|
| Sert les fichiers | `serve` dans un conteneur | nginx |
| API appelée par le navigateur | directement, `http://IP:8080` | relayée, même origine |
| CORS | **à configurer côté backend** | sans objet |
| HTTPS | à ajouter devant | géré par nginx |
| Fichiers | `Dockerfile`, `docker-compose.yml`, `.github/workflows/deploy.yml` | `nginx.conf` |

## Montage en service — `serve` + appel direct du backend

Le conteneur ne sert que les fichiers statiques ; le navigateur appelle le
backend à son adresse propre. `VITE_API_BASE_URL` doit donc porter l'URL
publique du backend, et **le backend doit autoriser l'origine du frontend** :

```properties
# côté backend, sinon le navigateur bloque tous les appels
APP_CORS_ALLOWED_ORIGINS=http://IP_DU_VPS:8081
```

### Déploiement manuel

```bash
# sur le VPS, à côté de docker-compose.yml
cat > .env <<'EOF'
VITE_API_BASE_URL=http://IP_DU_VPS:8080
FRONT_PORT=8081
EOF
docker compose up -d --build
```

`--build` est indispensable après tout changement de `VITE_API_BASE_URL` :
la valeur est **inscrite dans le bundle à la compilation**, la redéfinir dans
l'environnement du conteneur n'a aucun effet.

### Déploiement automatique

`.github/workflows/deploy.yml` construit l'image, la publie sur GitHub
Container Registry et la déploie par SSH. Les variables à renseigner dans
*Settings → Secrets and variables → Actions* sont listées en tête du fichier.

### Points de vigilance propres à ce montage

- **Le port 8080 du backend doit être joignable depuis le navigateur**, donc
  ouvert sur Internet. Voir plus bas « 127.0.0.1 et 0.0.0.0 sous Docker » :
  l'exposer directement contourne toute protection placée devant.
- **Pas de HTTPS.** Dès que le site est en HTTPS, le navigateur bloquera les
  appels vers une API en HTTP (contenu mixte) et le temps réel ne se
  connectera plus. Les deux doivent passer en HTTPS ensemble.
- **Deux origines** : toute nouvelle adresse du frontend doit être ajoutée à
  `APP_CORS_ALLOWED_ORIGINS`, sinon l'application se charge mais reste vide.

## Alternative — nginx, une seule origine

`nginx.conf` (fourni, non utilisé actuellement) sert les fichiers **et** relaie
`/api` et `/ws` vers le backend. Tout passe alors par une seule adresse :

- aucun CORS à configurer ;
- le port 8080 n'a plus besoin d'être public ;
- HTTPS se gère en un seul point ;
- `VITE_API_BASE_URL` reste **vide** et le même build fonctionne sur
  n'importe quel domaine.

En contrepartie : un composant de plus à installer et à maintenir. Le passage
de l'un à l'autre ne demande qu'un rebuild avec la variable vide et la mise en
place du fichier `nginx.conf`.

## À faire côté backend

Sans objet si le backend tourne déjà et que ces points ont été traités à son
installation. À vérifier néanmoins avec la personne qui en a la charge :

| Point | Pourquoi |
|---|---|
| `APP_JWT_SECRET` long et aléatoire | le secret de développement invaliderait toute la sécurité |
| Mot de passe PostgreSQL dédié | `parcauto/parcauto` ne vaut que pour la machine locale |
| `APP_STORAGE_UPLOAD_DIR` sur un volume persistant | sinon les fichiers envoyés disparaissent à chaque redéploiement |
| Sauvegarde de la base | `pg_dump` régulier ; aucune reprise possible sans cela |
| Jetons Mapbox et Traccar | stockés en base, à ressaisir dans l'écran Paramètres après la mise en ligne |

## Vérifier que tout fonctionne

```bash
# Le frontend répond
curl -I http://IP_DU_VPS:8081/                 # 200, text/html
curl -I http://IP_DU_VPS:8081/engins           # 200 et non 404 (repli SPA)

# Le backend est joignable DEPUIS LE NAVIGATEUR, donc depuis l'extérieur
curl -s http://IP_DU_VPS:8080/actuator/health  # {"status":"UP"}

# Le CORS autorise bien l'origine du frontend : la réponse doit porter
# access-control-allow-origin, sinon l'application restera vide
curl -sI -X OPTIONS http://IP_DU_VPS:8080/api/engins   -H "Origin: http://IP_DU_VPS:8081"   -H "Access-Control-Request-Method: GET" | grep -i access-control
```

Puis dans le navigateur : se connecter, ouvrir une carte (tuiles), et vérifier
le témoin **« En direct »** de la barre de navigation. S'il reste gris, le
WebSocket ne passe pas — vérifier que le port du backend est joignable et que
l'origine est autorisée.

## Reconnaître l'installation en place

À lancer sur le VPS :

```bash
# Qui écoute, et sur quoi
sudo ss -lntp | grep -E ':(80|443|8080|5432)\s'

# Un serveur web est-il déjà installé et actif ?
systemctl is-active nginx apache2 2>/dev/null

# Le backend tourne-t-il en conteneur ?
docker ps --format '{{.Names}}	{{.Image}}	{{.Ports}}' 2>/dev/null

# Le backend répond-il ?
curl -s localhost:8080/actuator/health
```

Lecture des résultats :

| Constat | Conséquence |
|---|---|
| `8080` écouté par `java` | `upstream` reste sur `127.0.0.1:8080` |
| `docker ps` montre le backend | mettre le nom du service dans `upstream`, et rattacher le frontend au même réseau Docker |
| `nginx` déjà actif | ne pas en installer un second : ajouter les blocs `location` de `nginx.conf` au fichier existant |
| `443` écouté | HTTPS déjà en place : le relais en profite automatiquement, et le temps réel bascule en `wss` |

## 127.0.0.1 et 0.0.0.0 sous Docker

Constat rencontré en production : « avec 127.0.0.1 ça ne marche pas, avec
0.0.0.0 ça marche ». L'explication tient en une phrase : **127.0.0.1 ne
désigne pas la machine, mais « moi-même » — et dans un conteneur, « moi-même »
est le conteneur, pas le VPS.** Chaque conteneur a sa propre pile réseau, donc
son propre loopback.

Deux réglages distincts portent ces adresses, et la bonne valeur n'est pas la
même :

**1. L'adresse d'écoute du backend, à l'intérieur du conteneur**

Si Spring Boot écoute sur `127.0.0.1:8080`, il n'accepte que les connexions
nées dans son propre conteneur : nginx, qui est ailleurs, est refusé. Il faut
`0.0.0.0` (valeur par défaut de Spring Boot, souvent forcée par erreur via
`SERVER_ADDRESS` ou `server.address`). **C'est correct et sans danger** : le
réseau du conteneur est isolé.

**2. La publication du port par Docker, vers l'hôte**

```
-p 8080:8080              # = 0.0.0.0 : exposé sur TOUTES les interfaces → Internet
-p 127.0.0.1:8080:8080    # exposé au seul hôte, donc à nginx
```

Ici `0.0.0.0` rend le backend **joignable depuis Internet**. Et c'est là que
le montage choisi change tout :

| Montage | Port 8080 du backend |
|---|---|
| **En service** (`serve` + appel direct) | **doit rester ouvert** — c'est le navigateur de chaque utilisateur qui appelle le backend |
| Alternative nginx (même origine) | à refermer — seul nginx, sur la machine, a besoin de l'atteindre |

Autrement dit, dans le montage actuel l'ouverture du port n'est pas une erreur
mais une nécessité. Ce qu'il faut en revanche, puisque le backend est exposé :
HTTPS, et une surveillance des accès.

### Refermer le port — seulement si l'on passe à nginx

Vérifier d'abord l'état, depuis une machine **autre que le VPS** :

```bash
curl -m 5 http://IP_DU_VPS:8080/actuator/health
```

Une réponse = le port est ouvert sur Internet. Deux façons de le refermer :

```bash
# a) ne plus publier le port du tout (nginx dans le même réseau Docker)
#    retirer la section ports: du service backend

# b) le publier sur le seul loopback de l'hôte
#    ports: ["127.0.0.1:8080:8080"]
```

Un `sudo ufw deny 8080` complète la mesure. **À ne pas appliquer tant que le
montage actuel est en place : l'application deviendrait inutilisable.**

**Règle à retenir : `0.0.0.0` à l'intérieur du conteneur. À la publication,
cela dépend du montage — ouvert avec `serve`, loopback avec nginx.**

## Limites connues

- **Pas de HTTPS.** Pour un test interne c'est acceptable, mais les jetons de
  session circulent en clair. Attention au passage : le frontend et le backend
  doivent basculer **ensemble**, sinon le navigateur bloque les appels d'une
  page HTTPS vers une API HTTP.
- **Pas de compression HTTP** avec `serve` : les 1 070 Ko du premier chargement
  partent tels quels, là où gzip les ramènerait à 321 Ko. C'est le gain le plus
  simple à obtenir — un proxy devant le conteneur (nginx, Caddy, Traefik) suffit.
- **Le port du backend doit rester ouvert** tant que le navigateur l'appelle
  directement. Le montage nginx le referme.
