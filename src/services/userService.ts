// import http, { Result } from '../utils/http';
import { Result } from '../utils/http';
import { PageResult } from '../hooks/useCrud';

export interface User {
    key: string;
    name: string;
    age: number;
    address: string;
    role: string;
}

// 模拟数据
let mockList: User[] = [
    { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park', role: 'admin' },
    { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park', role: 'user' },
    { key: '3', name: 'Joe Black', age: 32, address: 'Sydney No. 1 Lake Park', role: 'user' },
    { key: '4', name: 'Sarah White', age: 28, address: 'Dublin No. 2 Lake Park', role: 'user' },
    { key: '5', name: 'Mike Ross', age: 35, address: 'New York No. 2 Lake Park', role: 'admin' },
];

// 模拟延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const userService = {
    // 真实接口调用示例：
    // getList: (params: any) => http.get<PageResult<User>>('/users', { params }),
    // create: (data: Partial<User>) => http.post('/users', data),
    // update: (data: Partial<User>) => http.put(`/users/${data.key}`, data),
    // delete: (key: string) => http.delete(`/users/${key}`),

    // Mock 实现 (为了演示效果)
    getList: async (params: any): Promise<Result<PageResult<User>>> => {
        await delay(500);
        const { page = 1, pageSize = 10, name } = params;

        let list = [...mockList];
        if (name) {
            list = list.filter(item => item.name.toLowerCase().includes(name.toLowerCase()));
        }

        const total = list.length;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        list = list.slice(start, end);

        return {
            code: 200,
            message: 'success',
            data: {
                list,
                total
            }
        };
    },

    create: async (data: Partial<User>): Promise<Result<User>> => {
        await delay(500);
        const newUser = {
            ...data,
            key: (Math.random() * 1000).toFixed(0),
        } as User;
        mockList.unshift(newUser);
        return { code: 200, message: 'success', data: newUser };
    },

    update: async (data: Partial<User>): Promise<Result<User>> => {
        await delay(500);
        const index = mockList.findIndex(item => item.key === data.key);
        if (index > -1) {
            mockList[index] = { ...mockList[index], ...data } as User;
        }
        return { code: 200, message: 'success', data: mockList[index] };
    },

    delete: async (key: string | number): Promise<Result<null>> => {
        await delay(500);
        mockList = mockList.filter(item => item.key !== key);
        return { code: 200, message: 'success', data: null };
    }
};

export default userService;
