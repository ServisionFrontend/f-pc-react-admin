import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { message } from 'antd';

// 定义接口返回的通用结构
// 根据后端实际情况修改。通常会有 code, data, message
export interface Result<T = any> {
    code: number;
    message: string;
    data: T;
}

// 常见配置
const config = {
    // baseURL: import.meta.env.VITE_API_URL || '/api', // 如果有环境变量
    baseURL: '/api',
    timeout: 10000,
    withCredentials: true,
};

class Request {
    instance: AxiosInstance;

    constructor(config: AxiosRequestConfig) {
        this.instance = axios.create(config);

        // 请求拦截器
        this.instance.interceptors.request.use(
            (config) => {
                // 在这里可以添加 token，例如：
                // const token = localStorage.getItem('token');
                // if (token) {
                //   config.headers['Authorization'] = `Bearer ${token}`;
                // }
                return config;
            },
            (error: AxiosError) => {
                return Promise.reject(error);
            }
        );

        // 响应拦截器
        this.instance.interceptors.response.use(
            (response: AxiosResponse) => {
                // 直接返回 data，或者根据 code 判断业务逻辑
                const { code, message: msg } = response.data || {};
                // 假设 code === 200 为成功
                if (code !== undefined && code !== 200) {
                    message.error(msg || 'Request Error');
                    return Promise.reject(new Error(msg || 'Request Error'));
                }
                return response.data;
            },
            (error: AxiosError) => {
                // 处理 HTTP 状态码错误
                let msg = '';
                if (error.response) {
                    switch (error.response.status) {
                        case 401:
                            msg = '未授权，请登录';
                            // 可以在这里跳转登录页
                            break;
                        case 403:
                            msg = '拒绝访问';
                            break;
                        case 404:
                            msg = '请求地址出错';
                            break;
                        case 500:
                            msg = '服务器内部错误';
                            break;
                        default:
                            msg = '网络连接故障';
                    }
                } else {
                    msg = '网络连接超时或无法连接';
                }
                message.error(msg);
                return Promise.reject(error);
            }
        );
    }

    // 常用方法封装
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<Result<T>> {
        return this.instance.get(url, config);
    }

    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<Result<T>> {
        return this.instance.post(url, data, config);
    }

    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<Result<T>> {
        return this.instance.put(url, data, config);
    }

    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<Result<T>> {
        return this.instance.delete(url, config);
    }
}

export default new Request(config);
