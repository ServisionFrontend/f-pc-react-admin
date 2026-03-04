import { SvQuery } from '../../components';
import { partsQueryTemplateService, partsQueryFieldService } from '../PartsManagement/queryService';

const SvQueryDemo = () => {
    const handleSearch = (conditions: Record<string, any>) => {
        console.log('查询条件:', conditions);
    };

    const handleReset = () => {
        console.log('重置查询');
    };

    return (
        <div style={{ padding: 24 }}>
            <h2>SvQuery 查询管理组件演示</h2>
            <p>这个组件封装了查询管理功能，支持：</p>
            <ul>
                <li>动态加载查询字段</li>
                <li>查询模板管理（创建、加载、删除）</li>
                <li>查询条件保存和恢复</li>
                <li>展开/收起功能</li>
            </ul>

            <div style={{ marginTop: 24 }}>
                <SvQuery
                    templateService={partsQueryTemplateService}
                    fieldService={partsQueryFieldService}
                    onSearch={handleSearch}
                    onReset={handleReset}
                    defaultExpanded={false}
                    showTemplateManager={true}
                />
            </div>

            <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
                <h3>使用说明：</h3>
                <ol>
                    <li>点击"查询模板"下拉菜单可以查看和切换不同的查询模板</li>
                    <li>填写查询条件后点击"保存查询模板"可以保存当前的查询条件</li>
                    <li>点击"展开"按钮可以显示更多查询字段</li>
                    <li>点击"查询"按钮执行查询，查询条件会在控制台输出</li>
                    <li>点击"重置"按钮清空所有查询条件</li>
                </ol>
            </div>
        </div>
    );
};

export default SvQueryDemo;
