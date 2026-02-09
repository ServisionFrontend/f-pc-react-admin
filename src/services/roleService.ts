// import http, { Result } from '../utils/http';
import { Result } from '../utils/http';
import { PageResult } from '../hooks/useCrud';

export interface Role {
    key: string;
    roleName: string;
    roleCode: string;
    description: string;
    status: number; // 1 enabled, 0 disabled
}

let mockRoles: Role[] = [
    { key: '1', roleName: '超级管理员', roleCode: 'ROLE_SUPER_ADMIN', description: '拥有所有权限', status: 1 },
    { key: '2', roleName: '管理员', roleCode: 'ROLE_ADMIN', description: '普通管理员', status: 1 },
    { key: '3', roleName: '普通用户', roleCode: 'ROLE_USER', description: '普通注册用户', status: 1 },
    { key: '4', roleName: '访客', roleCode: 'ROLE_GUEST', description: '受限访问', status: 0 },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const roleService = {
    getList: async (params: any): Promise<Result<PageResult<Role>>> => {
        await delay(300);
        const { page = 1, pageSize = 10, roleName, roleCode } = params;

        let list = [...mockRoles];
        if (roleName) {
            list = list.filter(item => item.roleName.includes(roleName));
        }
        if (roleCode) {
            list = list.filter(item => item.roleCode.includes(roleCode));
        }

        const total = list.length;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        list = list.slice(start, end);

        return { code: 200, message: 'success', data: { list, total } };
    },

    create: async (data: Partial<Role>): Promise<Result<Role>> => {
        await delay(300);
        const newRole = {
            ...data,
            key: (Math.random() * 1000).toFixed(0),
            status: data.status !== undefined ? data.status : 1
        } as Role;
        mockRoles.unshift(newRole);
        return { code: 200, message: 'success', data: newRole };
    },

    update: async (data: Partial<Role>): Promise<Result<Role>> => {
        await delay(300);
        const index = mockRoles.findIndex(item => item.key === data.key);
        if (index > -1) {
            mockRoles[index] = { ...mockRoles[index], ...data } as Role;
        }
        return { code: 200, message: 'success', data: mockRoles[index] };
    },

    delete: async (key: string | number): Promise<Result<null>> => {
        await delay(300);
        mockRoles = mockRoles.filter(item => item.key !== key);
        return { code: 200, message: 'success', data: null };
    }
};

export default roleService;
