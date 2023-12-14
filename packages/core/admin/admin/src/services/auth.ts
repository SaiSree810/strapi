import {
  type RenewToken,
  type Login,
  type ResetPassword,
  type RegisterAdmin,
  type Register,
  type RegistrationInfo,
  ForgotPassword,
} from '../../../shared/contracts/authentication';

import { adminApi } from './admin';

import type { GetMe, UpdateMe } from '../../../shared/contracts/users';

const authService = adminApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * ME
     */
    getMe: builder.query<GetMe.Response['data'], void>({
      query: () => ({
        method: 'GET',
        url: '/admin/users/me',
      }),
      transformResponse(res: GetMe.Response) {
        return res.data;
      },
      providesTags: (res) => (res ? ['Me', { type: 'User', id: res.id }] : ['Me']),
    }),
    updateMe: builder.mutation<UpdateMe.Response['data'], UpdateMe.Request['body']>({
      query: (body) => ({
        method: 'PUT',
        url: '/admin/users/me',
        data: body,
      }),
      transformResponse(res: UpdateMe.Response) {
        return res.data;
      },
      invalidatesTags: ['Me'],
    }),
    /**
     * Auth methods
     */
    login: builder.mutation<Login.Response['data'], Login.Request['body']>({
      query: (body) => ({
        method: 'POST',
        url: '/admin/login',
        data: body,
      }),
      transformResponse(res: Login.Response) {
        return res.data;
      },
      invalidatesTags: ['Me'],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        method: 'POST',
        url: '/admin/logout',
      }),
      invalidatesTags: ['Me'],
    }),
    resetPassword: builder.mutation<ResetPassword.Response['data'], ResetPassword.Request['body']>({
      query: (body) => ({
        method: 'POST',
        url: '/admin/reset-password',
        data: body,
      }),
      transformResponse(res: ResetPassword.Response) {
        return res.data;
      },
    }),
    renewToken: builder.mutation<RenewToken.Response['data'], RenewToken.Request['body']>({
      query: (body) => ({
        method: 'POST',
        url: '/admin/renew-token',
        data: body,
      }),
      transformResponse(res: RenewToken.Response) {
        return res.data;
      },
    }),
    getRegistrationInfo: builder.query<
      RegistrationInfo.Response['data'],
      RegistrationInfo.Request['query']['registrationToken']
    >({
      query: (registrationToken) => ({
        url: '/admin/registration-info',
        method: 'GET',
        config: {
          params: {
            registrationToken,
          },
        },
      }),
      transformResponse(res: RegistrationInfo.Response) {
        return res.data;
      },
    }),
    registerAdmin: builder.mutation<RegisterAdmin.Response['data'], RegisterAdmin.Request['body']>({
      query: (body) => ({
        method: 'POST',
        url: '/admin/register-admin',
        data: body,
      }),
      transformResponse(res: RegisterAdmin.Response) {
        return res.data;
      },
    }),
    registerUser: builder.mutation<Register.Response['data'], Register.Request['body']>({
      query: (body) => ({
        method: 'POST',
        url: '/admin/register',
        data: body,
      }),
      transformResponse(res: Register.Response) {
        return res.data;
      },
    }),
    forgotPassword: builder.mutation<ForgotPassword.Response, ForgotPassword.Request['body']>({
      query: (body) => ({
        url: '/admin/forgot-password',
        method: 'POST',
        data: body,
      }),
    }),
  }),
  overrideExisting: false,
});

const {
  useGetMeQuery,
  useLoginMutation,
  useRenewTokenMutation,
  useLogoutMutation,
  useUpdateMeMutation,
  useResetPasswordMutation,
  useRegisterAdminMutation,
  useRegisterUserMutation,
  useGetRegistrationInfoQuery,
  useForgotPasswordMutation,
} = authService;

export {
  useGetMeQuery,
  useLoginMutation,
  useRenewTokenMutation,
  useLogoutMutation,
  useUpdateMeMutation,
  useResetPasswordMutation,
  useRegisterAdminMutation,
  useRegisterUserMutation,
  useGetRegistrationInfoQuery,
  useForgotPasswordMutation,
};
