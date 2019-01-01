const UglifyJS = require("uglify-js");
const {getOptions} = require('loader-utils');

module.exports = function(content) {
  console.log('loader-content: ')
  console.log(content)

  const callback = this.async();

  if (this.cacheable) {
    this.cacheable();
  }

  const options = getOptions(this) || {};

  // UglifyJS.minify(code, options)
  const result = UglifyJS.minify(content, options);
  console.log('result: ')
  console.log(result)
  console.log('result.code: ')
  console.log(result.code)
  callback(null, result.code || '');
}
