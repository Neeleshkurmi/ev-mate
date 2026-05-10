const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildTextSearchFilter = (term, fields) => {
  if (!term || typeof term !== "string" || !term.trim()) {
    return {};
  }

  const regex = new RegExp(escapeRegex(term.trim()), "i");

  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
};

module.exports = {
  buildTextSearchFilter,
};
