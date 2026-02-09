import React, { ReactNode, useState } from 'react';
import { SvCrudContext } from './context';
import { useCrud, PageResult } from '../../hooks/useCrud';
import http, { Result } from '../../utils/http';

interface SvCrudProps {
    children: ReactNode;
    readUrl?: string;
    createUrl?: string;
    updateUrl?: string;
    deleteUrl?: string;
    idKey?: string; // default 'key' or 'id'
    api?: any; // Allow passing custom API object (e.g. for mocks)
}

export const SvCrud: React.FC<SvCrudProps> = ({
    children,
    readUrl,
    createUrl,
    updateUrl,
    deleteUrl,
    api: customApi
}) => {
    // Dynamic API construction based on URLs
    // Dynamic API construction based on URLs
    // If specific URLs are not provided, default to readUrl (RESTful standard)
    const effectiveCreateUrl = createUrl || readUrl;
    const effectiveUpdateUrl = updateUrl || readUrl;
    const effectiveDeleteUrl = deleteUrl || readUrl;

    const defaultApi = {
        getList: async (params: any): Promise<Result<PageResult<any>>> => {
            if (!readUrl) return { code: 500, message: 'Read URL not provided', data: { list: [], total: 0 } };
            return http.get(readUrl, { params });
        },
        create: effectiveCreateUrl ? (data: any) => http.post(effectiveCreateUrl, data) : undefined,
        update: effectiveUpdateUrl ? (data: any) => http.put(effectiveUpdateUrl, data) : undefined,
        delete: effectiveDeleteUrl ? (id: any) => http.delete(`${effectiveDeleteUrl}/${id}`) : undefined,
    };

    const crud = useCrud({ api: customApi || defaultApi });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);

    const openCreateModal = () => {
        setEditingRecord(null);
        setIsModalOpen(true);
    };

    const openEditModal = (record: any) => {
        setEditingRecord(record);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRecord(null);
    };

    const contextValue = {
        ...crud,
        isModalOpen,
        editingRecord,
        openCreateModal,
        openEditModal,
        closeModal
    };

    return (
        <SvCrudContext.Provider value={contextValue}>
            <div className="sv-crud-container" style={{ padding: 0 }}>
                {children}
            </div>
        </SvCrudContext.Provider>
    );
};

export default SvCrud;
