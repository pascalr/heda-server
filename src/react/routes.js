const extractParamFromModel = (model) => {
  return model.id
}

const appendParams = (arg) => {
  if (typeof arg == 'object') {
    let s = "?"
    Object.keys(arg).forEach(key => {s += key + "=" + arg[key] + "&"})
    return s.substr(0, s.length-1)
  }
  return ''
}

const printParams = (params) => {
  if (!params) {return ''}
  return '?' + new URLSearchParams(params).toString();
}

export const icon_path = (arg) => {
  return `/icons/${arg}`
}

export const image_variant_path = (image, variant) => {
  //if (!image || !variant || !image.id) {console.log(`ERROR invalid image_variant_path variant=${variant} image=`, image); return null}
  if (!image || !image.id) {console.log(`ERROR invalid image_variant_path variant=${variant} image=`, image); return null}
  return `/images/${image.id}/${variant}`
}
export const image_path = (arg) => {
  return `/images/${extractParamFromModel(arg)}`
}
