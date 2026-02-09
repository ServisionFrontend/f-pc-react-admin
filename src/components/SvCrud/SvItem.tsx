import { ReactNode } from 'react';

export type ComponentType = 'text' | 'textbox' | 'number' | 'date' | 'select' | 'combobox' | 'radio' | 'switch';

export interface SvItemProps {
    type?: ComponentType;
    name?: string; // dataIndex / field name
    label?: string; // column title / form label
    width?: string | number;
    format?: string; // for date
    url?: string; // for select/combobox options source
    options?: { label: string; value: any }[]; // static options
    required?: boolean;
    maxlength?: number;
    render?: (text: any, record: any) => ReactNode; // Custom render for table
    hidden?: boolean; // Hidden in form or table
}

// Just a placeholder component for configuration
export const SvItem: React.FC<SvItemProps> = () => null;
