export interface SocietyEvidencePack {
  id: string;
  title: string;
  benefit: string;
  limitation: string;
  affectedGroups: string;
  historicalChange: string;
  quantitativeEvidence: string;
  competingConsiderations: string;
  sourceTitle: string;
  sourceUrl: string;
  reviewDate: string;
}

export const SOCIETY_EVIDENCE_PACKS: readonly SocietyEvidencePack[] = [
  {
    id: 'ultrasound',
    title: 'Medical ultrasound',
    benefit: 'High-frequency sound can produce real-time internal images without ionising radiation.',
    limitation: 'Image quality depends on the body region, operator, probe contact and interpretation; ultrasound energy must still be used prudently.',
    affectedGroups: 'Patients, families, sonographers, doctors and health services can experience different benefits, access and risks.',
    historicalChange: 'Electronic probes and computing made pulse-echo imaging a widely used medical tool rather than a laboratory technique.',
    quantitativeEvidence: 'Diagnostic systems commonly estimate sound speed in soft tissue as 1540 m/s when converting echo time to depth.',
    competingConsiderations: 'Avoiding ionising radiation is valuable, but a medically appropriate examination, trained operator and careful interpretation are still required.',
    sourceTitle: 'US FDA — Ultrasound Imaging and 510(k) K102901',
    sourceUrl: 'https://www.fda.gov/radiation-emitting-products/medical-imaging/ultrasound-imaging',
    reviewDate: '2026-07-20',
  },
  {
    id: 'fibre',
    title: 'Telecommunications and fibre optics',
    benefit: 'Light pulses in optical fibres carry large amounts of digital information over long distances.',
    limitation: 'Network upgrades cost money and access, affordability, maintenance and digital skills are not evenly distributed.',
    affectedGroups: 'Households, schools, businesses, regional communities, network workers and service providers are affected differently.',
    historicalChange: 'Fibre links replaced many lower-capacity electrical links in backbone and access networks and enabled data-intensive services.',
    quantitativeEvidence: 'NBN Co’s 2025 annual report states that 85% of homes and businesses were able to access the nbn network and records strong demand for 100 Mbit/s-and-above tiers.',
    competingConsiderations: 'Higher capacity can improve participation and productivity, while rollout choices, affordability and unequal access shape who benefits.',
    sourceTitle: 'NBN Co Annual Report 2025',
    sourceUrl: 'https://www.nbnco.com.au/content/dam/nbn/documents/about-nbn/reports/financial-reports/nbn-co-annual-report-2025.pdf',
    reviewDate: '2026-07-20',
  },
  {
    id: 'astronomy',
    title: 'Multiwavelength astronomical observation',
    benefit: 'Radio, infrared, visible, ultraviolet, X-ray and gamma observations reveal different temperatures, processes and materials.',
    limitation: 'Some bands require space instruments, observations are indirect and instruments select or process signals.',
    affectedGroups: 'Researchers, taxpayers, students, technology industries and communities near observatory sites can have different priorities.',
    historicalChange: 'NASA notes that access to the full electromagnetic spectrum became possible only in the twentieth-century rocket age.',
    quantitativeEvidence: 'The curated observatory compares six major astronomy bands beyond microwaves; visible-light-emitting objects are commonly in an approximately 10³–10⁴ K temperature range.',
    competingConsiderations: 'Scientific knowledge and technology benefits must be weighed with cost, environmental effects, site stewardship and fair access to data.',
    sourceTitle: 'NASA HEASARC — Multiwavelength Astronomy',
    sourceUrl: 'https://imagine.gsfc.nasa.gov/science/toolbox/multiwavelength1.html',
    reviewDate: '2026-07-20',
  },
  {
    id: 'transport',
    title: 'Transport safety and motion',
    benefit: 'Seatbelts and vehicle safety systems use force and motion principles to reduce injury risk.',
    limitation: 'No safety device prevents every injury; road design, speed, vehicle design and human behaviour also matter.',
    affectedGroups: 'Drivers, passengers, pedestrians, emergency services, vehicle makers and communities share costs and benefits.',
    historicalChange: 'Compulsory restraints, improved vehicle structures and evidence-led road rules changed expectations of crash protection.',
    quantitativeEvidence: 'The NSW Government reports that seatbelts double the chance of survival and that around 29 people are killed and 76 seriously injured each year on NSW roads because they were unrestrained.',
    competingConsiderations: 'Rules and enforcement affect personal choice, but preventable deaths and injuries impose consequences on families and the wider community.',
    sourceTitle: 'NSW Government — Seatbelts',
    sourceUrl: 'https://www.nsw.gov.au/driving-boating-and-transport/roads-safety-and-rules/safe-driving/seatbelts',
    reviewDate: '2026-07-20',
  },
  {
    id: 'satellite',
    title: 'Satellite sensing and navigation',
    benefit: 'Satellite signals and ground reference stations support positioning, mapping, agriculture, construction, mining and emergency response.',
    limitation: 'Accuracy and reliability depend on infrastructure, signal conditions, maintained reference frames and resilient systems.',
    affectedGroups: 'Regional industries, cities, emergency services, government, technology firms and people concerned about location privacy may value outcomes differently.',
    historicalChange: 'Positioning moved from specialised surveying towards continuously available services in phones, vehicles and machinery.',
    quantitativeEvidence: 'Geoscience Australia reports a network of more than 700 reference stations and forecasts an additional $0.5 billion of economic activity from national positioning infrastructure by 2038.',
    competingConsiderations: 'Productivity and safety benefits must be balanced with infrastructure cost, resilience, equitable regional coverage and responsible use of location data.',
    sourceTitle: 'Geoscience Australia — Precise positioning economic benefits',
    sourceUrl: 'https://www.ga.gov.au/news/precise-positioning-a-huge-boost-to-australian-economy-report',
    reviewDate: '2026-07-20',
  },
  {
    id: 'hearing',
    title: 'Sound technology and hearing health',
    benefit: 'Hearing devices, captions, loop systems and safe-listening technology can support communication, education and participation.',
    limitation: 'Technology does not remove access barriers, stigma, cost, maintenance needs or the diversity of Deaf and hard-of-hearing communication preferences.',
    affectedGroups: 'Deaf and hard-of-hearing people, families, schools, employers, health services and technology providers have different experiences and priorities.',
    historicalChange: 'Electronic amplification, cochlear implants, digital signal processing, captions and communication access tools expanded available choices.',
    quantitativeEvidence: 'WHO reports that more than 1 billion young adults are at risk of avoidable hearing loss from unsafe listening and that unaddressed hearing loss costs almost US$1 trillion globally each year.',
    competingConsiderations: 'Prevention and accessible technology can improve participation, but policy must respect autonomy, communication choice, affordability and cultural identity.',
    sourceTitle: 'World Health Organization — Deafness and hearing loss',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss',
    reviewDate: '2026-07-20',
  },
] as const;

export const ASTRONOMY_BAND_EVIDENCE = {
  radio: 'Cold gas, magnetic fields and energetic particles; many radio bands reach ground observatories.',
  infrared: 'Cool stars, warm dust and star-forming regions; only selected atmospheric windows reach the ground.',
  visible: 'Starlight continua and spectral lines; a major atmospheric window for ground telescopes.',
  ultraviolet: 'Hot stars and energetic gas; mostly absorbed by Earth’s atmosphere, so space telescopes are used.',
  xray: 'Very hot gas, supernova remnants and compact objects; blocked by Earth’s atmosphere.',
  gamma: 'The most energetic events and processes; blocked by Earth’s atmosphere.',
} as const;

export const HEARING_PROTECTION_POINTS = [
  'Turn personal listening levels down and take quiet breaks.',
  'Move away from very loud sources and use suitable hearing protection when required.',
  'Follow workplace, venue and school safety guidance; this explorer is not a hearing test.',
] as const;
