import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { HOST, BASE_URL } from "./config";
import { ElMessage as message, MessageHandle } from "element-plus";
import router from "@/router";

export interface HttpAxiosError extends AxiosError {
  isTips?: boolean;
}

export interface HttpResponseBase<T> {
  code: string;
  data: T;
  msg: string;
  flag: boolean;
}

let status401msg: MessageHandle | undefined;
let status404msg: MessageHandle | undefined;
let status500msg: MessageHandle | undefined;
export class Http {
  private static _instance: Http;
  public http: AxiosInstance;
  constructor(config?: AxiosRequestConfig | undefined) {
    this.http = axios.create(config);
    this.http.interceptors.request.use((config) => {
      config = {
        ...config,
        headers: {
          ...config.headers,
          Authorization: localStorage.getItem("token") || "",
        },
      };
      return config;
    });
    this.http.interceptors.response.use(
      (response) => {
        return response.data;
      },
      (error) => {
        return this.responseErrorHander(error);
      },
    );
  }
  public static getInstance(): Http {
    if (!this._instance) {
      this._instance = new Http({
        baseURL: HOST + BASE_URL,
        timeout: 60000,
      });
    }
    return this._instance;
  }
  private responseErrorHander(err: AxiosError) {
    const _err: HttpAxiosError = err;
    if (!_err.isAxiosError) {
      message.error("网络异常，请检查网络");
      _err.isTips = true;
    } else {
      if (_err?.response?.status) {
        // 有HTTP状态码
        // message.error("有http状态码");
        if (_err?.response?.status === 500) {
          if (!status500msg) {
            status500msg = message.error("服务器异常，状态 500");
            setTimeout(() => {
              status500msg = undefined;
            }, 2000);
          }
          _err.isTips = true;
        } else if (_err?.response?.status === 404) {
          if (!status404msg) {
            status404msg = message.error("请求失败，状态 404");
            setTimeout(() => {
              status401msg = undefined;
            }, 2000);
          }
          _err.isTips = true;
        } else if (_err?.response?.status === 401) {
          if (!status401msg) {
            status401msg = message.error("登录失效，请重新登录");
            setTimeout(() => {
              status401msg = undefined;
            }, 2000);
          }
          _err.isTips = true;
          router.push("/login");
        }
      } else {
        // 没有HTTP状态码
        message.error("网络连接失败，请重试");
        _err.isTips = true;
      }
    }
    return Promise.reject(_err);
  }
  public async get<T = any>(url: string, config?: AxiosRequestConfig | undefined): Promise<HttpResponseBase<T>> {
    return await this.http.get(url, config);
  }
  public async delete<T = any>(url: string, config?: AxiosRequestConfig | undefined): Promise<HttpResponseBase<T>> {
    return await this.http.delete(url, config);
  }
  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig | undefined): Promise<HttpResponseBase<T>> {
    return await this.http.post(url, data, config);
  }
  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig | undefined): Promise<HttpResponseBase<T>> {
    return await this.http.put(url, data, config);
  }
}

export default Http.getInstance();
