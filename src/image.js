
export const uploadImage = (file) => {
  let ext = file.name.substr(file.name.lastIndexOf('.') + 1).toLowerCase();
  if (!['jpg', 'jpeg', 'png'].includes(ext)) {
    // FIXME: Send the user locale from the client side in order to translate properly.
    return res.status(500).json({publicError: tr('Image_format_not_supported') + ext});
  }

  let {record_table, record_id, record_field} = req.body

  db.transaction(() => {

    let lastId = db.prepare('SELECT MAX(id) from images').get()['MAX(id)']
    let slug = `${lastId+1}.${ext}`
    let image = {filename: file.name, slug}
    image = db.createRecord('images', image, req.user.user_id, {allow_write: ['slug']})
    if (image.id != lastId +1) {throw "Database invalid state for images."}
    db.safeUpdateField(record_table, record_id, record_field, slug, req.user)

    // FIXME: This should probably be inside the transaction, but this runs async.
    // Use the mv() method to place the file somewhere on your server
    file.mv(path.join(IMAGE_FOLDER, image.id + '.' + ext), function(err) {
      if (err) { return res.status(500).send(err); }
      res.json(image)
    });
  })()
}
