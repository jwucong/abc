const UglifyJS = require("uglify-js");
const {getOptions} = require('loader-utils');

module.exports = function(content) {

  const callback = this.async();

  if (this.cacheable) {
    this.cacheable();
  }

  const options = getOptions(this) || {};

  // UglifyJS.minify(code, options)
  const result = UglifyJS.minify(content, options);
  callback(null, result.code || '');
}
