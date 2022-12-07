const IN_FIELD_NAME = 'in';

export default () => ({
  fieldName: IN_FIELD_NAME,

  strapiOperator: '$in',

  add(t, type) {
    return t.field({ type: [type] });
  },
});
