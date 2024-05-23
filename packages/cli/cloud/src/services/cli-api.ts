import axios, { type AxiosResponse } from 'axios';
import * as fs from 'fs';
import os from 'os';
import { apiConfig } from '../config/api';
import type { CloudCliConfig } from '../types';
import { getLocalConfig } from '../config/local';

import packageJson from '../../package.json';

export const VERSION = 'v1';

export type ProjectInfos = {
  name: string;
  nodeVersion: string;
  region: string;
  plan?: string;
  url?: string;
};
export type ProjectInput = Omit<ProjectInfos, 'id'>;

export type DeployResponse = {
  build_id: string;
  image: string;
};

export type TrackPayload = Record<string, unknown>;

export interface CloudApiService {
  deploy(
    deployInput: {
      filePath: string;
      project: { name: string };
    },
    {
      onUploadProgress,
    }: {
      onUploadProgress: (progressEvent: { loaded: number; total?: number }) => void;
    }
  ): Promise<AxiosResponse<DeployResponse>>;

  createProject(projectInput: ProjectInput): Promise<{
    data: ProjectInfos;
    status: number;
  }>;

  getUserInfo(): Promise<AxiosResponse>;

  config(): Promise<AxiosResponse<CloudCliConfig>>;

  listProjects(): Promise<AxiosResponse<ProjectInfos[]>>;

  track(event: string, payload?: TrackPayload): Promise<AxiosResponse<void>>;
}

export function cloudApiFactory(token?: string): CloudApiService {
  const localConfig = getLocalConfig();
  const customHeaders = {
    'x-device-id': localConfig.deviceId,
    'x-app-version': packageJson.version,
  };
  const axiosCloudAPI = axios.create({
    baseURL: `${apiConfig.apiBaseUrl}/${VERSION}`,
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
    },
  });

  if (token) {
    axiosCloudAPI.defaults.headers.Authorization = `Bearer ${token}`;
  }

  return {
    deploy({ filePath, project }, { onUploadProgress }) {
      return axiosCloudAPI.post(
        `/deploy/${project.name}`,
        { file: fs.createReadStream(filePath) },
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress,
        }
      );
    },

    async createProject({ name, nodeVersion, region, plan }) {
      const response = await axiosCloudAPI.post('/project', {
        projectName: name,
        region,
        nodeVersion,
        plan,
      });

      return {
        data: {
          id: response.data.id,
          name: response.data.name,
          nodeVersion: response.data.nodeVersion,
          region: response.data.region,
        },
        status: response.status,
      };
    },

    getUserInfo() {
      return axiosCloudAPI.get('/user');
    },

    config(): Promise<AxiosResponse<CloudCliConfig>> {
      return axiosCloudAPI.get('/config');
    },

    listProjects() {
      return axiosCloudAPI.get<ProjectInfos[]>('/projects');
    },

    track(event, payload = {}) {
      return axiosCloudAPI.post<void>(
        '/track',
        {
          event,
          payload,
        },
        {
          headers: {
            'x-os-name': os.type(),
            'x-os-version': os.version(),
            'x-language': Intl.DateTimeFormat().resolvedOptions().locale,
            'x-node-version': process.versions.node,
          },
        }
      );
    },
  };
}
