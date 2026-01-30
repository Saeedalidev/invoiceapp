/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          '@': './src',
        },
        extensions: ['.js', '.json'],
        root: ['./src'],
      },
    ],
    'inline-dotenv',
    '@babel/plugin-transform-export-namespace-from',
  ],
  presets: ['module:@react-native/babel-preset'],
};
