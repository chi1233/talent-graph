/**
 * Computes researchers who appear in both the General AI and AI Safety datasets.
 * Returns an array of { name, generalNode, safetyNode } sorted by generalNode rank.
 */
export function computeOverlap(generalNodes, safetyNodes) {
  const generalPersons = generalNodes.filter(n => n.label === 'Person')
  const safetyPersons  = safetyNodes.filter(n => n.label === 'Person')

  // Build a name→node map for safety list
  const safetyByName = new Map(safetyPersons.map(n => [n.name.toLowerCase(), n]))

  // Annotate general nodes with their positional rank (index + 1)
  const results = []
  generalPersons.forEach((gNode, idx) => {
    const sNode = safetyByName.get(gNode.name.toLowerCase())
    if (sNode) {
      // Attach rank hints so the card can display them
      const safetyIdx = safetyPersons.findIndex(n => n.name.toLowerCase() === gNode.name.toLowerCase())
      results.push({
        name:        gNode.name,
        generalNode: { ...gNode, _rank: idx + 1 },
        safetyNode:  { ...sNode, _rank: safetyIdx + 1 },
      })
    }
  })

  // Sort by general rank ascending
  results.sort((a, b) => a.generalNode._rank - b.generalNode._rank)
  return results
}
