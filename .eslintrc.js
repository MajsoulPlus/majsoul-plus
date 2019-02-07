module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 2018
  },
  extends: 'eslint:recommended',
  rules: {
    indent: [
      'error',
      2,
      {
        SwitchCase: 1
      }
    ],
    'linebreak-style': ['error', 'windows'],
    quotes: ['error', 'single'],
    semi: ['error', 'never']
  }
}
