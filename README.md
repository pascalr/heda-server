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
fly doctor // Si je n'arrive pas à me connecter avec fly ssh console, fly doctor diagnostique le problème
fly ssh console
echo "ls && exit" | fly ssh console
chown -R heroku:heroku /mnt
#### Rollback
fly releases --image
fly deploy -i registry.fly.io/heda-server@sha256:67super-long-hash-super-long-hash-super-long-hash
chown heroku prod.db
chgrp heroku prod.db
chmod 666 prod.db

## Wireguard
sudo apt install wireguard
ln -s /usr/bin/resolvectl /usr/local/bin/resolvconf # S'il y a une erreur avec resolvconf
sudo wg # Pour voir l'état de wireguard, si rien ne s'affiche, il faut faire wg-quick up ...
fly wireguard create # Entrer le nom de fichier: var/heda-server.conf. LE FICHIER DOIT ETRE DANS VAR POUR ETRE SUR DE NE PAS SE RETROUVER DANS GIT!!!
wg-quick up var/heda-server.conf
scp root@heda-server.internal:/mnt/heda_volume/prod.db var/db/dev.db
//https://community.fly.io/t/how-to-copy-files-off-a-vm/1651/7
flyctl ssh issue --agent
references:
https://www.digitalocean.com/community/tutorials/how-to-set-up-wireguard-on-ubuntu-20-04
