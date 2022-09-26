# Heda Server

## .env
Store secret API and credentials inside .env

## Npm watch
Pour voir les modifications en effet chaque fois qu'un fichier change, il faut installer watch.
https://stackoverflow.com/questions/60424844/do-i-need-to-run-npm-run-build-every-time-i-made-changes
1. npm install watch
1. watch 'npm start'

## Credit
Les os de l'application ont de base été créer selon: https://github.com/passport/todos-express-password
Les images de chefs cuisinier: https://pixabay.com/vectors/chef-character-cook-gourmet-1417239/
SQlite3 tool: sqlitebrowser

## Fly.io
fly ssh console
echo "ls && exit" | fly ssh console

## Wireguard
sudo apt install wireguard
ln -s /usr/bin/resolvectl /usr/local/bin/resolvconf # S'il y a une erreur avec resolvconf
fly wireguard create # Entrer le nom de fichier: var/heda-server.conf. LE FICHIER DOIT ETRE DANS VAR POUR ETRE SUR DE NE PAS SE RETROUVER DANS GIT!!!
wg-quick up var/heda-server.conf
scp root@heda-server.internal:/mnt/heda_volume/prod.db var/db/dev.db
