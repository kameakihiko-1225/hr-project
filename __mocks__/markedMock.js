module.exports = {
  marked: {
    /**
     * Basic mock implementation that just returns the input Markdown unchanged.
     * This is sufficient for unit tests that don\'t rely on Markdown parsing output.
     * @param {string} md Markdown string
     * @returns {string}
     */
    parse(md) {
      return md;
    }
  }
}; 