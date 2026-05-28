export interface DocumentChunk {
  id: string;
  source: string;
  category: "HighRise" | "Marine" | "Excavation" | "Infrastructure" | "Residential";
  content: string;
}

// Academic Reference database representing OSHA & Municipal Compliance Codes
const REGULATORY_DICTIONARY: DocumentChunk[] = [
  {
    id: "osha-highrise-netting",
    source: "OSHA CFR 1926.105(a)",
    category: "HighRise",
    content: "Safety nets shall be provided when workplaces are more than 25 feet above the ground or water surface, or other surfaces where the use of ladders, scaffolds, catch platforms, temporary floors, safety lines, or safety belts is impractical."
  },
  {
    id: "osha-crane-wind",
    source: "OSHA CFR 1926.1426",
    category: "HighRise",
    content: "Wind speed alarms (anemometers) must be installed on all high-elevation cranes. Crane lifting operations must be suspended immediately if wind speed exceeds 25 kph (15.5 mph) to prevent boom structural sway."
  },
  {
    id: "muni-fire-riser",
    source: "Karachi Building Control Authority (KBCA) Sec 14-3",
    category: "HighRise",
    content: "For structures exceeding 5 storeys, active wet fire riser standpipes must run concurrently with building steel-framing and floor elevations to ensure immediate structural fire protection."
  },
  {
    id: "osha-trench-shoring",
    source: "OSHA CFR 1926 Subpart P",
    category: "Excavation",
    content: "Active trench shoring, shielding, or sloping is mandatory for all excavations exceeding 5 feet in depth. Soil density compaction testing must be conducted daily to identify ground moisture stratification hazards."
  },
  {
    id: "osha-spoil-pile",
    source: "OSHA CFR 1926.651(j)(2)",
    category: "Excavation",
    content: "Employees must be protected from excavated materials that could pose a hazard by falling or rolling into excavations. Spoil piles must be kept at a minimum of 2 feet (0.61 meters) from the edge of the excavation."
  },
  {
    id: "coastguard-lifejackets",
    source: "USCG Title 46 & OSHA 1926.106",
    category: "Marine",
    content: "Employees working over or adjacent to water where the danger of drowning exists shall be provided with U.S. Coast Guard-approved lifejackets or buoyant work vests (Type III) at all times."
  },
  {
    id: "marine-saltwater-shoring",
    source: "Marine Engineering Standards Sec 8.2",
    category: "Marine",
    content: "Any load-bearing piles or foundation grids deployed in saline or tidal conditions must undergo specialized marine saltwater proofing, incorporating anti-corrosion titanium alloys and saltwater shoring wall layers."
  },
  {
    id: "infra-subterranean-sonar",
    source: "Subterranean Utility Code Sec 4.1",
    category: "Infrastructure",
    content: "Prior to any ground breaking or road-bed excavation, high-density subterranean sonar mapping must be executed to map existing water, gas, electricity, and telecommunication conduits."
  },
  {
    id: "infra-expansion-joint",
    source: "AASHTO Highway Standards Sec 10",
    category: "Infrastructure",
    content: "Roadway concrete pours must integrate high-durability thermal expansion joints at exact 20-foot increments to prevent buckling under intense sunlight and temperature stress."
  },
  {
    id: "muni-dust-containment",
    source: "KBCA Residential Zoning Sec 2.8",
    category: "Residential",
    content: "Dust containment shrouds and continuous misting systems must be active during framing and demolition in residential areas. Noise mitigation barriers must be deployed between 7 PM and 7 AM."
  }
];

/**
 * Computes Jaccard Similarity (intersection over union of lowercase text terms)
 * enriched with project category heuristics to return the top 2 regulatory compliance guides.
 */
export function retrieveRegulatoryDocs(query: string, projectCategory?: string): DocumentChunk[] {
  const stopWords = new Set(["and", "the", "a", "of", "to", "in", "is", "for", "with", "on", "at", "or"]);
  
  // Tokenize and clean the search query
  const queryTerms = query.toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(t => t.length > 2 && !stopWords.has(t));

  if (queryTerms.length === 0) {
    // Return standard safety defaults if query terms are empty
    return REGULATORY_DICTIONARY.slice(0, 2);
  }

  const scoredDocs = REGULATORY_DICTIONARY.map(doc => {
    // Parse document content into tokens
    const docTerms = new Set(
      doc.content.toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter(t => t.length > 2 && !stopWords.has(t))
    );

    // Compute Jaccard index (Intersection over Union)
    let intersectionSize = 0;
    for (const term of queryTerms) {
      if (docTerms.has(term)) {
        intersectionSize++;
      }
    }

    const unionSize = queryTerms.length + docTerms.size - intersectionSize;
    const jaccardScore = unionSize > 0 ? (intersectionSize / unionSize) : 0;

    // Apply categorical boost if the document category matches the project context
    const isMatchingCategory = projectCategory && doc.category.toLowerCase() === projectCategory.toLowerCase();
    const categoryBoost = isMatchingCategory ? 0.35 : 0.0;

    const finalScore = jaccardScore + categoryBoost;

    return { doc, score: finalScore };
  });

  // Sort matched documents by descending similarity score
  scoredDocs.sort((a, b) => b.score - a.score);

  // Return the top 2 most relevant policy document chunks
  return scoredDocs.slice(0, 2).map(item => item.doc);
}
