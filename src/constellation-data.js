export const CONSTELLATION_NODES = [
  { id: 'tung', starName: 'Polaris (Sao Bắc Cực)', x: 200, y: 160, isPolaris: true },
  { id: 'tunganh', starName: 'Yildun', x: 330, y: 220, isPolaris: false },
  { id: 'hau', starName: 'Epsilon UMa', x: 470, y: 280, isPolaris: false },
  { id: 'tuantran', starName: 'Zeta UMa', x: 580, y: 170, isPolaris: false },
  { id: 'hung', starName: 'Eta UMa', x: 600, y: 330, isPolaris: false },
  { id: 'duyanh', starName: 'Pherkad', x: 790, y: 340, isPolaris: false },
  { id: 'thach', starName: 'Kochab', x: 770, y: 180, isPolaris: false },
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
