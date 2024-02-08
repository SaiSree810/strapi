import { Common } from '@strapi/types';
import { mapAsync, pipeAsync } from '@strapi/utils';
import { isObject } from 'lodash/fp';
import { createIdMap } from './id-map';
import { extractDataIds as extractDataRelationIds } from './relations/extract/data-ids';
import { transformDataIdsVisitor as transformRelationDataIds } from './relations/transform/data-ids';
import { transformOutputIds as transformRelationOutputIds } from './relations/transform/output-ids';
import { switchIdForDocumentId } from './utils';
import { transformFilters } from './filters';
import { transformSort } from './sort';
import { transformFields } from './fields';
import { transformPopulate } from './populate';

/**
 * Transform input of a query to map document ids to entity ids.
 */
async function transformParamsDocumentId(
  uid: Common.UID.Schema,
  input: { data?: any; fields?: any; filters?: any; populate?: any; sort?: any },
  opts: {
    locale?: string | null;
    isDraft: boolean;
  }
) {
  const idMap = createIdMap({ strapi });

  // Extract any relation ids from the input
  if (input.data) {
    await extractDataRelationIds(idMap, input.data, { ...opts, uid });
  }

  // Load any relation the extract methods found
  await idMap.load();

  // Transform any relation ids to entity ids
  let fields = input.fields;
  if (input.fields) {
    fields = transformFields(input.fields);
  }

  let data = input.data;
  if (input.data) {
    data = await transformRelationDataIds(idMap, input.data, { ...opts, uid });
  }

  let filters = input.filters;
  if (input.filters) {
    filters = await transformFilters(input.filters, { ...opts, uid });
  }

  let populate = input.populate;
  if (input.populate) {
    populate = await transformPopulate(input.populate, { ...opts, uid });
  }

  let sort = input.sort;
  if (input.sort) {
    sort = await transformSort(input.sort, { ...opts, uid });
  }

  return {
    ...input,
    data,
    fields,
    filters,
    populate,
    sort,
  };
}

/**
 * Transform response of a query to map entity ids to document ids.
 */
async function transformOutputDocumentId(
  uid: Common.UID.Schema,
  output: Record<string, any> | Record<string, any>[]
) {
  if (Array.isArray(output)) {
    return mapAsync(output, (o: Record<string, any>) => transformOutputDocumentId(uid, o));
  }

  // TODO: Ensure we always have documentId on output
  if (!isObject(output) || !output?.documentId) return output;

  return pipeAsync(
    // Switch top level id -> documentId
    switchIdForDocumentId,
    // Switch relations id -> documentId
    (output) => transformRelationOutputIds(uid, output)
  )(output);
}

export { transformParamsDocumentId, transformOutputDocumentId };
