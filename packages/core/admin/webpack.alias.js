'use strict';
const path = require('path');
const {requirePackage, adminAliases} = require('./pnp')
const alias = [
  'object-assign',
  'whatwg-fetch',
  '@fortawesome/fontawesome-free',
  '@fortawesome/fontawesome-svg-core',
  '@fortawesome/free-solid-svg-icons',
  'history',
  'hoist-non-react-statics',
  'immer',
  'invariant',
  'lodash',
  'moment',
  'qs',
  'react',
  'react-copy-to-clipboard',
  'react-dnd',
  'react-dnd-html5-backend',
  'react-dom',
  'react-error-boundary',
  'react-fast-compare',
  'react-helmet',
  'react-is',
  'react-intl',
  'react-redux',
  'react-router',
  'react-router-dom',
  'react-virtualized',
  'react-select',
  'redux',
  'reselect',
  'styled-components',
  'yup',
  'axios',
  'prop-types',
  'react-query',
  'semver',
  'js-cookie',
  'formik',
  'match-sorter',
  '@fortawesome/react-fontawesome',
  'date-fns',
  "markdown-it",
    "markdown-it-abbr",
    "markdown-it-container",
    "markdown-it-deflist",
    "markdown-it-emoji",
    "markdown-it-footnote",
    "markdown-it-ins",
    "markdown-it-mark",
    "markdown-it-sub",
    "markdown-it-sup",
    "match-sorter",
    
    "sanitize-html",
    "@fingerprintjs/fingerprintjs"
    
    
  
  
];

module.exports = alias.reduce(
  (acc, curr) => {
    acc[`${curr}$`] = requirePackage.resolve(curr);
    return acc;
  },
  {
    ...adminAliases,
    'react-select/animated': requirePackage.resolve('react-select/animated'),
    'react-select/async': requirePackage.resolve('react-select/async'),
    'react-select/async-creatable': requirePackage.resolve('react-select/async-creatable'),
    'react-select/base': requirePackage.resolve('react-select/base'),
    'react-select/creatable': requirePackage.resolve('react-select/creatable'),
    ee_else_ce: path.resolve(__dirname),
  }
);
