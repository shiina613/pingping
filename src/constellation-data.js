export const CONSTELLATION_NODES = [
  { id: 'tung', starName: 'Polaris (Sao Bắc Cực)', x: 120, y: 110, isPolaris: true },
  { id: 'tunganh', starName: 'Yildun', x: 260, y: 190, isPolaris: false },
  { id: 'hau', starName: 'Epsilon UMa', x: 420, y: 270, isPolaris: false },
  { id: 'tuantran', starName: 'Zeta UMa', x: 570, y: 180, isPolaris: false },
  { id: 'hung', starName: 'Eta UMa', x: 590, y: 390, isPolaris: false },
  { id: 'duyanh', starName: 'Pherkad', x: 860, y: 410, isPolaris: false },
  { id: 'thach', starName: 'Kochab', x: 840, y: 200, isPolaris: false },
];

export const CONSTELLATION_LINES = [
  ['tung', 'tunganh'],
  ['tunganh', 'hau'],
  ['hau', 'tuantran'],
  ['tuantran', 'thach'],
  ['thach', 'duyanh'],
  ['duyanh', 'hung'],
  ['hung', 'hau'],
];

export function getConstellationMembers(membersList = []) {
  return CONSTELLATION_NODES.map(node => {
    const member = membersList.find(m => m.id === node.id) || {};
    return { ...member, ...node };
  });
}
