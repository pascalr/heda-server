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

export const image_slug_variant_path = (imageSlug, variant) => {
  return `/imgs/${variant}/${imageSlug}`
}
export const image_path = (imageOrSlug, variant) => {
  if (!variant) {throw "ImagePath requires a variant..."}
  if (typeof imageOrSlug == "string") {
    return `/imgs/${variant}/${imageOrSlug}`
  } else {
    return `/imgs/${variant}/${imageOrSlug.slug}`
  }
}
