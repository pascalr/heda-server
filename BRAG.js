/**
 * Pour savoir si une variable est null ou elle est un array vide,
 * simplement utiliser !obj?.length
 * Ne fonctionne pas pour les boolean et les chiffres
 */
const isBlank = (obj) => !obj?.length

/**
 * Je viens de découvrir un pattern vraiment cool je crois.
 * Ce pattern permets d'avoir accès aux variables d'un children super facilement.
 * Il reste à le peauffiner.
 */
const withTableSelector = () => {
  const [table, setTable] = useState(null)

  let options = Object.keys(schema).sort()
  let elem = <select value={table||''} onChange={(e) => setTable(e.target.value)}>
    <option value="" label=" "></option>
    {options.map((opt, i) => {
      return <option value={opt} key={opt}>{opt}</option>
    })}
  </select>
  return [table, elem]
}
