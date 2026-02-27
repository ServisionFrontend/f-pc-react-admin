import { createContext, useContext } from 'react';

interface SvCrudContextType {
    data: any[];
    loading: boolean;
    pagination: {
        current: number;
        pageSize: number;
        total: number;
    };
    fetchList: (params?: any, page?: number, pageSize?: number) => Promise<void>;
    handleTableChange: (pagination: any, filters?: any, sorter?: any) => void;
    createItem: (data: any) => Promise<boolean>;
    updateItem: (data: any) => Promise<boolean>;
    deleteItem: (id: string | number) => Promise<boolean>;
    onSearch: (params: any) => void;
    onReset: () => void;

    // Edit Modal State
    isModalOpen: boolean;
    editingRecord: any | null;
    openCreateModal: () => void;
    openEditModal: (record: any) => void;
    closeModal: () => void;
}

export const SvCrudContext = createContext<SvCrudContextType | null>(null);

export const useSvCrudContext = () => {
    return useContext(SvCrudContext);
};
