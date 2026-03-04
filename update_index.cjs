const fs = require('fs');
const path = require('path');
const file = path.join('d:', 'workspace', 'react', 'f-pc-react-admin', 'src', 'pages', 'PartsManagement', 'index.tsx');

let code = fs.readFileSync(file, 'utf8');
const lines = code.split('\n');

const startIdx = lines.findIndex(l => l.includes('// 可拖拽的查询方案菜单项组件'));
const endIdx = lines.findIndex(l => l.includes('const statusOptions = ['));

if (startIdx !== -1 && endIdx !== -1) {
    const imports = [
        'import {',
        '  SortableSchemeItem,',
        '  SortableField,',
        '  ExpandableTextArea,',
        '  SizeSelectModal,',
        '  EditableCell',
        '} from "./components";'
    ];
    lines.splice(startIdx, endIdx - startIdx, ...imports);

    code = lines.join('\n');
    code = code.replace(/import partsService, { Part } from "\.\.\/services\/partsService";/g, 'import partsService, { Part } from "./service";');
    code = code.replace(/import { SvTable } from "\.\.\/components";/g, 'import { SvTable } from "../../components";');

    fs.writeFileSync(file, code, 'utf8');
    console.log("Replaced lines and imports.");
} else {
    console.log("Could not find boundaries", startIdx, endIdx);
}
