# Déploiement de test sur un VPS

Marche à suivre pour mettre l'application en ligne sur un serveur de test.
Concerne le frontend ; les points qui dépendent du backend sont signalés.

## Principe retenu : une seule origine

nginx sert le frontend **et** relaie `/api` et `/ws` vers le backend. Tout passe
par la même adresse, ce qui supprime d'un coup trois sources d'ennuis :

- aucun CORS à configurer ;
- aucun blocage de contenu mixte (page en HTTPS appelant une API en HTTP) ;
- le build ne dépend plus du domaine : la même image fonctionne sur
  `http://203.0.113.10` comme sur `https://parcauto.exemple.mg`.

C'est pourquoi `VITE_API_BASE_URL` reste **vide**. Une valeur n'est nécessaire
que si le backend vit sur un autre domaine — il faut alors HTTPS des deux côtés
et déclarer l'origine du frontend dans `APP_CORS_ALLOWED_ORIGINS`.

## Prérequis sur le VPS

- Docker et Docker Compose, ou bien Node 22 + nginx si l'on compile à la main ;
- 2 Go de RAM au minimum (le backend Java en consomme l'essentiel) ;
- les ports 80 (et 443 si certificat) ouverts.

## Le backend est déjà en place sur le VPS

Dans ce cas, seul le frontend reste à installer : nginx sert les fichiers et
relaie `/api` et `/ws` vers le backend local. Rien à modifier côté backend —
en particulier `APP_CORS_ALLOWED_ORIGINS` devient sans objet, puisque le
navigateur ne voit qu'une seule origine.

Avant de configurer, identifier l'existant (voir « Reconnaître l'installation
en place » plus bas) : le backend écoute-t-il sur 8080, tourne-t-il en
conteneur, et un serveur web est-il déjà installé ? La réponse change
seulement deux choses : l'adresse dans le bloc `upstream` de `nginx.conf`, et
le fait d'ajouter un fichier de configuration plutôt que d'installer nginx.

## Option A — Docker Compose (recommandée pour un test)

Le `Dockerfile` du frontend est fourni. À la racine du projet, un
`docker-compose.yml` assemble les trois services :

```yaml
services:
  db:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: parcauto
      POSTGRES_USER: parcauto
      POSTGRES_PASSWORD: ${DB_PASSWORD:?mot de passe requis}
    volumes: [db-data:/var/lib/postgresql/data]

  backend:
    build: ./backend            # à confirmer avec le responsable du backend
    environment:
      SPRING_PROFILES_ACTIVE: prod
      APP_DB_URL: jdbc:postgresql://db:5432/parcauto
      APP_DB_USERNAME: parcauto
      APP_DB_PASSWORD: ${DB_PASSWORD}
      APP_JWT_SECRET: ${JWT_SECRET:?secret requis}
      APP_STORAGE_UPLOAD_DIR: /data/uploads
    volumes: [uploads:/data/uploads]
    depends_on: [db]

  frontend:
    build:
      context: ./frontend2
      args:
        VITE_API_BASE_URL: ""   # même origine, voir plus haut
    ports: ["80:80"]
    depends_on: [backend]

volumes:
  db-data:
  uploads:
```

Les deux volumes nommés sont essentiels : sans `db-data` la base repart de zéro
à chaque redéploiement, sans `uploads` les photos de véhicules et les proformas
disparaissent.

```bash
export DB_PASSWORD='…'   # à générer, pas celui de développement
export JWT_SECRET="$(openssl rand -base64 48)"
docker compose up -d --build
```

## Option B — Compilation manuelle (backend déjà en place)

La compilation peut se faire sur le poste de développement puis être copiée :
le VPS n'a alors besoin ni de Node ni des sources.

```bash
# --- sur le poste de développement ---
cd frontend2
npm ci
VITE_API_BASE_URL= npm run build     # variable vide = même origine
tar czf parcauto-frontend.tgz -C dist .
scp parcauto-frontend.tgz nginx.conf UTILISATEUR@VPS:/tmp/

# --- sur le VPS ---
sudo mkdir -p /var/www/parcauto
sudo tar xzf /tmp/parcauto-frontend.tgz -C /var/www/parcauto
sudo cp /tmp/nginx.conf /etc/nginx/sites-available/parcauto
# adapter deux lignes du fichier :
#   root  → /var/www/parcauto   (au lieu de /usr/share/nginx/html, valeur Docker)
#   upstream → l'adresse relevée à l'étape « Reconnaître l'installation »
sudo ln -sf /etc/nginx/sites-available/parcauto /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

`nginx -t` avant le rechargement n'est pas une précaution de style : une erreur
de syntaxe non détectée laisse nginx sur son ancienne configuration sans
prévenir, et l'on cherche ensuite pourquoi rien n'a changé.

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
curl -I  http://VOTRE_VPS/                    # 200, type text/html
curl -s  http://VOTRE_VPS/actuator/health     # {"status":"UP"}
curl -I  http://VOTRE_VPS/engins              # 200 (et non 404 : repli SPA)
curl -sI http://VOTRE_VPS/api/engins | head -1  # 401 ou 403 = le relais marche
```

Puis dans le navigateur : se connecter, ouvrir une carte (tuiles), et vérifier
le témoin **« En direct »** de la barre de navigation — s'il reste gris, le
relais WebSocket (`location /ws/`) ne fonctionne pas.

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

Ici `0.0.0.0` rend le backend **joignable directement depuis Internet**, en
contournant nginx : plus de HTTPS, plus de limite de taille d'envoi, plus de
journalisation centralisée.

### Vérifier si le backend est exposé

Depuis une machine **autre que le VPS** :

```bash
curl -m 5 http://IP_DU_VPS:8080/actuator/health
```

Une réponse = le port est ouvert sur Internet. Deux façons de refermer :

```bash
# a) ne plus publier le port du tout (nginx dans le même réseau Docker)
#    retirer la section ports: du service backend

# b) le publier sur le seul loopback de l'hôte
#    ports: ["127.0.0.1:8080:8080"]
```

Puis, en complément, un pare-feu : `sudo ufw deny 8080`.

**Règle à retenir : `0.0.0.0` à l'intérieur du conteneur, `127.0.0.1` à la
publication.**

## Limites connues

- **Pas de HTTPS dans cette configuration.** Pour un test interne c'est
  acceptable, mais les jetons de session circulent en clair. Sur une adresse
  publique, ajouter un certificat (Certbot) avant toute donnée réelle.
- **Bundle de 2,4 Mo** (674 Ko compressés), en un seul fichier. La compression
  gzip est active dans `nginx.conf` ; un découpage par route reste à faire si le
  premier chargement est jugé trop lent.
- **La police Google Sans est chargée depuis Google Fonts.** Sur un serveur sans
  accès sortant, ou derrière un filtrage, l'interface bascule sur une police
  système. L'auto-hébergement est possible (le thème « nuit » le fait déjà pour
  Source Sans 3).
