export function t(id) {
  let en = {
    Edit_profile: 'Edit profile',
    Name: 'Name',
    Image: 'Image',
    Delete: 'Delete',
    Ok: 'Ok',
  }
  let fr = {
    Edit_profile: 'Modifier le profil',
    Name: 'Nom',
    Image: 'Image',
    Delete: 'Supprimer',
    Ok: 'Ok',
  }
  let g = (typeof window === 'undefined') ? global : window
  let locale = g['locale']
  let lang = locale == 'fr' ? fr : en
  if (!lang[id]) {throw 'Missing translation for '+id+' in '+locale}
  return lang[id]
}
