import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { Result } from '../utils/http'; // 假设你上面的 http.ts export 了 Result

export interface PageResult<T> {
    list: T[];
    total: number;
}

interface CrudOptions<T, P extends Record<string, any>> {
    api: {
        // 获取列表
        getList: (params: P & { page?: number; pageSize?: number }) => Promise<Result<PageResult<T>>>;
        // 新增
        create?: (data: Partial<T>) => Promise<Result<any>>;
        // 更新
        update?: (data: Partial<T>) => Promise<Result<any>>;
        // 删除
        delete?: (id: string | number) => Promise<Result<any>>;
    };
    // 是否立即加载
    isImmediate?: boolean;
    // 默认分页参数
    defaultPageSize?: number;
}

export function useCrud<T = any, P extends Record<string, any> = {}>({
    api,
    isImmediate = true,
    defaultPageSize = 10,
}: CrudOptions<T, P>) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: defaultPageSize,
        total: 0,
    });
    // 查询参数
    const [searchParams, setSearchParams] = useState<P>({} as P);

    // 获取列表
    const fetchList = useCallback(
        async (params?: P, page = pagination.current, size = pagination.pageSize) => {
            setLoading(true);
            try {
                const mergedParams = { ...searchParams, ...params, page, pageSize: size };
                // 更新查询参数状态
                if (params) {
                    setSearchParams((prev) => ({ ...prev, ...params }));
                }

                const res = await api.getList(mergedParams);
                if (res.code === 200) {
                    setData(res.data.list);
                    setPagination({
                        current: page,
                        pageSize: size,
                        total: res.data.total,
                    });
                }
            } catch (error) {
                console.error(error);
                // message.error 由 http 拦截器处理了，这里可以根据需要处理
            } finally {
                setLoading(false);
            }
        },
        [api, pagination.current, pagination.pageSize, searchParams]
    );

    // 初始化加载
    useEffect(() => {
        if (isImmediate) {
            fetchList();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // 只挂载时执行一次，除非手动调用 fetchList

    // 翻页处理
    const handleTableChange = (pag: any, _filters?: any, _sorter?: any) => {
        fetchList(undefined, pag.current, pag.pageSize);
    };

    // 新增
    const createItem = async (row: Partial<T>) => {
        if (!api.create) return false;
        try {
            setLoading(true);
            const res = await api.create(row);
            if (res.code === 200) {
                message.success('Create Success');
                fetchList(); // 刷新列表
                return true;
            }
        } catch (e) {
            // error handled by interceptor
        } finally {
            setLoading(false);
        }
        return false;
    };

    // 更新
    const updateItem = async (row: Partial<T>) => {
        if (!api.update) return false;
        try {
            setLoading(true);
            const res = await api.update(row);
            if (res.code === 200) {
                message.success('Update Success');
                fetchList();
                return true;
            }
        } catch (e) {

        } finally {
            setLoading(false);
        }
        return false;
    };

    // 删除
    const deleteItem = async (id: string | number) => {
        if (!api.delete) return false;
        try {
            setLoading(true);
            const res = await api.delete(id);
            if (res.code === 200) {
                message.success('Delete Success');
                // 如果当前页只有一条且不是第一页，删除后向前翻页
                if (data.length === 1 && pagination.current > 1) {
                    fetchList(undefined, pagination.current - 1);
                } else {
                    fetchList();
                }
                return true;
            }
        } catch (e) {

        } finally {
            setLoading(false);
        }
        return false;
    };

    // 搜索
    const onSearch = (params: P) => {
        // 搜索时重置到第一页
        setSearchParams(params);
        fetchList(params, 1, pagination.pageSize);
    };

    // 重置
    const onReset = () => {
        setSearchParams({} as P);
        fetchList({} as P, 1, pagination.pageSize);
    };

    return {
        data,
        loading,
        pagination,
        fetchList,
        handleTableChange,
        createItem,
        updateItem,
        deleteItem,
        onSearch,
        onReset
    };
}
