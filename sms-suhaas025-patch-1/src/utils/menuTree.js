export function buildMenuTree(components) {
  const map = {};
  const roots = [];
  components.forEach(comp => {
    map[comp.id] = { ...comp, children: [] };
  });
  components.forEach(comp => {
    if (comp.parentId && map[comp.parentId]) {
      map[comp.parentId].children.push(map[comp.id]);
    } else {
      roots.push(map[comp.id]);
    }
  });
  return roots;
} 