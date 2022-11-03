# Heda Server

Message to fly:
How to use scp with fly properly?
I am able to make it work, but it's a pain every time. Any way to make it easier? Here how it goes for me:
scp ... ... ... ...
ssh: Could not resolve hostname heda-server.internal: Name or service not known
Alright I check wireguard status:
sudo wg
Not running...
wg-quick up path-to-file.conf
scp ... ... ... ...
Does not work...
fly doctor
Does not work... I try to go on Hacker News when waiting, hacker news does not work anymore...
restart internet
Internet works. Fly doctor works.

If there could be a fly scp command that would be sooooooooo awesome.

:q



## Live reload
nodemon is used to live reload front-end pages (views)
livereload is used to live reload compiled back-end pages (public/build)
connect-livereload is used to refresh the browser page automatically
// npm install --save-dev chokidar
TODO: Watch esbuild to rebuild files on changes: https://github.com/zaydek/esbuild-hot-reload/blob/master/serve.js
// https://stackoverflow.com/questions/24750395/reload-express-js-routes-changes-without-manually-restarting-server
// https://bytearcher.com/articles/refresh-changes-browser-express-livereload-nodemon/

## .env
Store secret API and credentials inside .env
Add
DB_URL="./var/db/dev.db"
VOLUME_PATH="volume"

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
chown heroku prod.db
chgrp heroku prod.db
chmod 666 prod.db
#### Rollback
fly releases --image
fly deploy -i registry.fly.io/heda-server@sha256:67super-long-hash-super-long-hash-super-long-hash

## Wireguard
sudo apt install wireguard
ln -s /usr/bin/resolvectl /usr/local/bin/resolvconf # S'il y a une erreur avec resolvconf
#### POUR RÉSOUDRE root@heda-server.internal: Permission denied (publickey)
flyctl ssh issue --agent
#### Autre
sudo wg # Pour voir l'état de wireguard, si rien ne s'affiche, il faut faire wg-quick up ...
fly wireguard create # Entrer le nom de fichier: var/heda-server.conf. LE FICHIER DOIT ETRE DANS VAR POUR ETRE SUR DE NE PAS SE RETROUVER DANS GIT!!!
wg-quick up var/heda-server.conf
scp root@heda-server.internal:/mnt/heda_volume/prod.db var/db/dev.db
//https://community.fly.io/t/how-to-copy-files-off-a-vm/1651/7
references:
https://www.digitalocean.com/community/tutorials/how-to-set-up-wireguard-on-ubuntu-20-04

## Stable diffustion
... in a baking dish
... on a plate (this way the image is less zoomed on the food)

## Docker
docker images # to list all docker images
TODO: Only copy min js files inside the docker image

To run docker without using sudo, add user to docker group:
sudo usermod -aG docker $USER
Then restart ubuntu.

## Healthy programming

I have an unhealthy habit of constantly trying to improve. When you have a clear goal, it's Ok it does not matter very much.

So let's say I start writing an app. I have a lot of things to do. A have a lot of ideas.
I start working and everything goes great.
But then I'm in the middle of writing the app and I start to lose focus. I start to think to much about the how and not enough about the what.
By the end when I'm about to finish the app, I am constantly wanting to rewrite everything a better way.
It's fine, do it better for the next project. But who cares for this one.
If I change how something is done, THERE MUST BE A VALID REASON. I need a what.


THE ABSOLUTE WORST THING I COULD DO RIGHT NOW IS TO TRY TO IMPROVE THE CODE IN THE HOPE THAT SOMEONE SEES IT WHEN I POST FOR A JOB... I WOULD GET STUCK IN A CONSTANT LOOP OF IMPROVEMENT AND DEPRESSION...
