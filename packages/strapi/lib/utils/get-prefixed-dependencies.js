module.exports = (prefix, pkgJSON) => {
  return Object.keys(pkgJSON.dependencies)
    .filter(d => (d.includes(`/${prefix}`) || d.startsWith(prefix)) && d.length > prefix.length)
    .map(pkgName => pkgName.substring(prefix.length + 1));
};
