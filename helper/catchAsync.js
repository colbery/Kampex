module.exports = fc => {
    return (req, res, next) => {
        fc(req, res, next).catch(next);
    }
}