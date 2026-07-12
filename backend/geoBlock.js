
function geoBlock(req, res, next) {
  const country = req.headers["x-country-code"];

  if (country !== "BR") {
    return res.status(403).send("Acesso bloqueado");
  }

  next();
}

module.exports = geoBlock;

function geoBlock(req, res, next) {
  const country = req.headers["x-country-code"];

  if (country !== "BR") {
    return res.status(403).send("Acesso bloqueado");
  }

  next();
}

module.exports = geoBlock;

