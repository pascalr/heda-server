export function tr(id, locale) {
  let en = {
    Edit_profile: 'Edit profile',
    Name: 'Name',
    Image: 'Image',
    Delete: 'Delete',
    Ok: 'Ok',
    Language: 'Language',
  }
  let fr = {
    Edit_profile: 'Modifier le profil',
    Name: 'Nom',
    Image: 'Image',
    Delete: 'Supprimer',
    Ok: 'Ok',
    Language: 'Language',
  }
  let lang = locale == 'fr' ? fr : en
  if (!lang[id]) {throw 'Missing translation for '+id+' in '+locale}
  return lang[id]
}

export function t(id) {
  let g = (typeof window === 'undefined') ? global : window
  return tr(id, g['locale'])
}
