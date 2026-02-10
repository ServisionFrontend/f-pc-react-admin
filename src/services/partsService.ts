import { Result } from '../utils/http';
import { PageResult } from '../hooks/useCrud';

export interface Part {
    key: string;
    partNo: string;        // 配件编号
    partName: string;      // 配件名称
    partNameEn: string;    // 配件英文名称
    size: string;          // 尺寸
    section: string;       // 科组（使用部位）
    quantity: number;      // 用量
    status: string;        // 状态
    remark: string;        // 备注
}

// 模拟数据
let mockList: Part[] = [
    { key: '1', partNo: 'P001', partName: '螺丝M6x20', partNameEn: 'Screw M6x20', size: 'M6x20mm', section: 'door', quantity: 100, status: 'active', remark: '常用配件' },
    { key: '2', partNo: 'P002', partName: '垫片φ10', partNameEn: 'Washer φ10', size: 'φ10x2mm', section: 'door', quantity: 200, status: 'active', remark: '标准件' },
    { key: '3', partNo: 'P003', partName: '弹簧垫圈M8', partNameEn: 'Spring Washer M8', size: 'M8', section: 'chassis', quantity: 150, status: 'inactive', remark: '备用' },
    { key: '4', partNo: 'P004', partName: '六角螺母M10', partNameEn: 'Hex Nut M10', size: 'M10', section: 'engine', quantity: 80, status: 'active', remark: '' },
    { key: '5', partNo: 'P005', partName: '平垫圈M12', partNameEn: 'Flat Washer M12', size: 'M12x24x2.5mm', section: 'chassis', quantity: 120, status: 'active', remark: '高强度' },
    { key: '6', partNo: 'P006', partName: '内六角螺栓M8x30', partNameEn: 'Socket Head Cap Screw M8x30', size: 'M8x30mm', section: 'door', quantity: 60, status: 'inactive', remark: '特殊规格' },
    { key: '7', partNo: 'P007', partName: '定位销φ6x30', partNameEn: 'Dowel Pin φ6x30', size: 'φ6x30mm', section: 'interior', quantity: 45, status: 'active', remark: '' },
    { key: '8', partNo: 'P008', partName: '轴承6205', partNameEn: 'Bearing 6205', size: '25x52x15mm', section: 'engine', quantity: 30, status: 'active', remark: '进口件' },
];

// 模拟延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const partsService = {
    getList: async (params: any): Promise<Result<PageResult<Part>>> => {
        await delay(400);
        const { page = 1, pageSize = 10, partNo, partName, partNameEn, size, section, status } = params;

        let list = [...mockList];

        // 过滤掉可能存在的空数据
        list = list.filter(item => item.partNo && item.partNo.trim() !== '');

        if (partNo) {
            list = list.filter(item => item.partNo.toLowerCase().includes(partNo.toLowerCase()));
        }
        if (partName) {
            list = list.filter(item => item.partName.toLowerCase().includes(partName.toLowerCase()));
        }
        if (partNameEn) {
            list = list.filter(item => item.partNameEn.toLowerCase().includes(partNameEn.toLowerCase()));
        }
        if (size) {
            list = list.filter(item => item.size.toLowerCase().includes(size.toLowerCase()));
        }
        if (section) {
            list = list.filter(item => item.section === section);
        }
        if (status) {
            list = list.filter(item => item.status === status);
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

    create: async (data: Partial<Part>): Promise<Result<Part>> => {
        await delay(400);
        const newPart = {
            ...data,
            key: (Math.random() * 10000).toFixed(0),
        } as Part;
        mockList.unshift(newPart);
        return { code: 200, message: 'success', data: newPart };
    },

    update: async (data: Partial<Part>): Promise<Result<Part>> => {
        await delay(400);
        const index = mockList.findIndex(item => item.key === data.key);
        if (index > -1) {
            mockList[index] = { ...mockList[index], ...data } as Part;
        }
        return { code: 200, message: 'success', data: mockList[index] };
    },

    delete: async (key: string | number): Promise<Result<null>> => {
        await delay(400);
        mockList = mockList.filter(item => item.key !== key);
        return { code: 200, message: 'success', data: null };
    }
};

export default partsService;
