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
    { key: '9', partNo: 'P009', partName: '自攻螺钉ST4.2x13', partNameEn: 'Self-tapping Screw ST4.2x13', size: 'ST4.2x13mm', section: 'door', quantity: 500, status: 'active', remark: '门板紧固' },
    { key: '10', partNo: 'P010', partName: '卡扣A型', partNameEn: 'Clip Type A', size: 'Standard', section: 'interior', quantity: 1000, status: 'active', remark: '易耗品' },
    { key: '11', partNo: 'P011', partName: '密封条R20', partNameEn: 'Seal Strip R20', size: '2000mm', section: 'door', quantity: 50, status: 'active', remark: '防水密封' },
    { key: '12', partNo: 'P012', partName: '减震垫', partNameEn: 'Rubber Buffer', size: 'φ30x15mm', section: 'chassis', quantity: 150, status: 'active', remark: '底盘减震' },
    { key: '13', partNo: 'P013', partName: '机油滤芯', partNameEn: 'Oil Filter', size: 'Standard', section: 'engine', quantity: 25, status: 'active', remark: '保养周期件' },
    { key: '14', partNo: 'P014', partName: '空气滤芯', partNameEn: 'Air Filter', size: 'Standard', section: 'engine', quantity: 30, status: 'active', remark: '保养周期件' },
    { key: '15', partNo: 'P015', partName: '刹车片组', partNameEn: 'Brake Pad Set', size: 'Standard', section: 'chassis', quantity: 40, status: 'active', remark: '前轮' },
    { key: '16', partNo: 'P016', partName: '火花塞', partNameEn: 'Spark Plug', size: 'NGK-5', section: 'engine', quantity: 120, status: 'active', remark: '铂金款' },
    { key: '17', partNo: 'P017', partName: '雨刮片', partNameEn: 'Wiper Blade', size: '24 inch', section: 'interior', quantity: 60, status: 'active', remark: '无骨雨刮' },
    { key: '18', partNo: 'P018', partName: '冷凝器', partNameEn: 'Condenser', size: 'Large', section: 'engine', quantity: 10, status: 'inactive', remark: '缺货预警' },
    { key: '19', partNo: 'P019', partName: '拉手底座', partNameEn: 'Handle Base', size: 'Standard', section: 'door', quantity: 85, status: 'active', remark: '' },
    { key: '20', partNo: 'P020', partName: '玻璃升降机', partNameEn: 'Window Regulator', size: 'Left Front', section: 'door', quantity: 15, status: 'active', remark: '电动' },
    { key: '21', partNo: 'P021', partName: '保险丝5A', partNameEn: 'Fuse 5A', size: 'Small', section: 'interior', quantity: 2000, status: 'active', remark: '迷你规格' },
    { key: '22', partNo: 'P022', partName: '灯泡H4', partNameEn: 'Bulb H4', size: '12V 55W', section: 'interior', quantity: 100, status: 'active', remark: '大灯用' },
    { key: '23', partNo: 'P023', partName: '传动皮带', partNameEn: 'Drive Belt', size: '6PK1200', section: 'engine', quantity: 20, status: 'active', remark: '高性能' },
    { key: '24', partNo: 'P024', partName: '球头销', partNameEn: 'Ball Joint', size: 'M14', section: 'chassis', quantity: 35, status: 'active', remark: '转向系统' },
    { key: '25', partNo: 'P025', partName: '尼龙扎带', partNameEn: 'Nylon Tie', size: '3x150mm', section: 'interior', quantity: 5000, status: 'active', remark: '黑色' },
    { key: '26', partNo: 'P026', partName: '散热器支架', partNameEn: 'Radiator Bracket', size: 'Left', section: 'engine', quantity: 12, status: 'active', remark: '' },
    { key: '27', partNo: 'P027', partName: '水泵', partNameEn: 'Water Pump', size: 'Standard', section: 'engine', quantity: 8, status: 'inactive', remark: '特价待补' },
    { key: '28', partNo: 'P028', partName: '控制臂', partNameEn: 'Control Arm', size: 'Front Lower', section: 'chassis', quantity: 18, status: 'active', remark: '铝合金' },
    { key: '29', partNo: 'P029', partName: '遮阳板', partNameEn: 'Sun Visor', size: 'Grey', section: 'interior', quantity: 25, status: 'active', remark: '主驾侧' },
    { key: '30', partNo: 'P030', partName: '门锁电机', partNameEn: 'Door Lock Motor', size: 'Standard', section: 'door', quantity: 22, status: 'active', remark: '中控锁' },
];

// 模拟延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const partsService = {
    getList: async (params: any): Promise<Result<PageResult<Part>>> => {
        await delay(400);
        const { page = 1, pageSize = 10, partNo, partName, partNameEn, size, section, status, sortField, sortOrder } = params;

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

        // 排序
        if (sortField && sortOrder) {
            list.sort((a, b) => {
                const valA = (a as any)[sortField];
                const valB = (b as any)[sortField];

                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortOrder === 'ascend' ? valA - valB : valB - valA;
                }

                const strA = String(valA || '');
                const strB = String(valB || '');
                return sortOrder === 'ascend'
                    ? strA.localeCompare(strB, 'zh-CN')
                    : strB.localeCompare(strA, 'zh-CN');
            });
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
