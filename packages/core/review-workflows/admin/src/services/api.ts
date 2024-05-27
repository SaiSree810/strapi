import { adminApi } from '@strapi/admin/strapi-admin';

const reviewWorkflowsApi = adminApi.enhanceEndpoints({
  addTagTypes: ['ReviewWorkflow', 'ReviewWorkflowStages'],
});

export { reviewWorkflowsApi };
