/**
 * This file contains utility functions for generating names used in the database.
 * These names include table names, column names, join table names, index names, and more.
 * The generated names can be customized with prefixes, suffixes, and maximum length.
 * These utility functions are used throughout the codebase to ensure consistent and standardized naming conventions in the database.
 *
 * The reason for checking maxLength for suffixes and prefixes and using the long ones from Strapi 4 is so that we always
 * have access to the full length names, in particular for migration purposes, but also so that (in theory) the feature
 * could be disabled and stay compatible with v4 database structure.
 */
import _ from 'lodash/fp';
import { getNameFromTokens } from './shortener';

// Constants for column names used in naming methods
export const ID_COLUMN = 'id';
export const ORDER_COLUMN = 'order';
export const FIELD_COLUMN = 'field';

type NameInput = string | string[];

type NameOptions = {
  suffix?: string;
  prefix?: string;
  maxLength: number;
  snakeCase?: boolean;
};

// Generic name handler that must be used by all helper functions
/**
 * TODO: we should be requiring snake_case inputs for all names here, but we
 * aren't and it will require some refactoring to make it work. Currently if
 * we get names 'myModel' and 'my_model' they would be converted to the same
 * final string my_model which generally works but is not entirely safe
 * */
export const getName = (names: NameInput, options: NameOptions) => {
  const tokens = _.castArray(names).map((name) => {
    return {
      name,
      compressible: true,
    };
  });

  if (options?.suffix) {
    tokens.push({ name: options.suffix, compressible: false });
  }

  if (options?.prefix) {
    tokens.unshift({ name: options.prefix, compressible: false });
  }

  return getNameFromTokens(tokens, { maxLength: options.maxLength, snakeCase: options.snakeCase });
};

/**
 * TABLES
 */

export const getTableName = (name: string, options: NameOptions) => {
  return getName(name, options);
};

export const getJoinTableName = (
  collectionName: string,
  attributeName: string,
  options: NameOptions
) => {
  return getName([collectionName, attributeName], {
    suffix: options.maxLength ? 'lnk' : 'links',
    ...options,
  });
};

export const getMorphTableName = (
  collectionName: string,
  attributeName: string,
  options: NameOptions
) => {
  return getName([collectionName, attributeName], {
    suffix: options.maxLength ? 'mph' : 'morphs',
    ...options,
  });
};

/**
 * COLUMNS
 */

export const getColumnName = (attributeName: string, options: NameOptions) => {
  return getName(attributeName, options);
};

export const getJoinColumnAttributeIdName = (attributeName: string, options: NameOptions) => {
  return getName(attributeName, { suffix: 'id', ...options });
};

export const getInverseJoinColumnAttributeIdName = (
  attributeName: string,
  options: NameOptions
) => {
  return getName(attributeName, { suffix: 'id', prefix: 'inv', ...options });
};

export const getOrderColumnName = (singularName: string, options: NameOptions) => {
  return getName(singularName, { suffix: options.maxLength ? 'ord' : 'order', ...options });
};

export const getInverseOrderColumnName = (singularName: string, options: NameOptions) => {
  return getName(singularName, {
    suffix: options.maxLength ? 'ord' : 'order',
    prefix: 'inv',
    ...options,
  });
};

/**
 * Morph Join Tables
 */
export const getMorphColumnJoinTableIdName = (singularName: string, options: NameOptions) => {
  return getName(singularName, { suffix: 'id', ...options });
};

export const getMorphColumnAttributeIdName = (attributeName: string, options: NameOptions) => {
  return getName(attributeName, { suffix: 'id', ...options });
};

export const getMorphColumnTypeName = (attributeName: string, options: NameOptions) => {
  return getName(attributeName, { suffix: 'type', ...options });
};

/**
 * INDEXES
 * Note that these methods are generally used to reference full table names + attribute(s), which
 * may already be shortened strings rather than individual parts.
 * That is fine and expected to compress the previously incompressible parts of those strings,
 * because in these cases the relevant information is the table name and we can't really do
 * any better; shortening the individual parts again might make it even more confusing.
 *
 * For example, the fk for mytable_myattr4567d_localizations would become
 * mytable_myattr4567d_loc63bf2_fk
 *
 */

export const getIndexName = (names: NameInput, options: NameOptions) => {
  return getName(names, { suffix: options.maxLength ? 'idx' : 'index', ...options });
};

export const getFkIndexName = (names: NameInput, options: NameOptions) => {
  return getName(names, { suffix: 'fk', ...options });
};

export const getInverseFkIndexName = (names: NameInput, options: NameOptions) => {
  return getName(names, { suffix: options.maxLength ? 'ifk' : 'inv_fk', ...options });
};

export const getOrderFkIndexName = (names: NameInput, options: NameOptions) => {
  return getName(names, { suffix: options.maxLength ? 'ofk' : 'order_fk', ...options });
};

export const getOrderInverseFkIndexName = (names: NameInput, options: NameOptions) => {
  return getName(names, { suffix: options.maxLength ? 'oifk' : 'order_inv_fk', ...options });
};

export const getIdColumnIndexName = (names: NameInput, options: NameOptions) => {
  return getName(names, { suffix: options.maxLength ? 'idix' : 'id_column_index', ...options });
};

export const getOrderIndexName = (names: NameInput, options: NameOptions) => {
  return getName(names, { suffix: options.maxLength ? 'oidx' : 'order_index', ...options });
};

export const getUniqueIndexName = (names: NameInput, options: NameOptions) => {
  return getName(names, { suffix: options.maxLength ? 'uq' : 'unique', ...options });
};

export const getPrimaryIndexName = (names: NameInput, options: NameOptions) => {
  return getName(names, { suffix: options.maxLength ? 'pk' : 'primary', ...options });
};
