export function resolvePath(obj, path) {
  // if (typeof path === 'object') {
  //   return path.split('.').reduce((acc, key) => acc?.[key], obj);
  // }
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}
