export function t(id) {
  let en = {
    edit_profile: 'Edit profile',
  }
  let fr = {
    edit_profile: 'Modifier le profil',
  }
  let g = (typeof window === 'undefined') ? global : window
  let locale = g['locale']
  let lang = locale == 'fr' ? fr : en
  return lang[id]
}
