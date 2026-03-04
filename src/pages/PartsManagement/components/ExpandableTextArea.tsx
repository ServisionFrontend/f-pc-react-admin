import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { Input } from "antd";

// 可展开文本框组件 - 默认单行，聚焦时浮动展开为多行
export interface ExpandableTextAreaProps {
    value?: string;
    onChange?: (value: string) => void;
}

export const ExpandableTextArea: React.FC<ExpandableTextAreaProps> = ({
    value,
    onChange,
}) => {
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        if (focused && inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setPosition({
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
    }, [focused]);

    return (
        <>
            <div ref={inputRef} style={{ position: "relative" }}>
                {/* 始终显示的单行输入框 */}
                <Input
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    autoComplete="off"
                    onFocus={() => setFocused(true)}
                    style={{ opacity: focused ? 0 : 1, height: "32px" }}
                />
            </div>
            {/* 浮动的多行文本框 - 使用 Portal 渲染到 body */}
            {focused &&
                ReactDOM.createPortal(
                    <div
                        style={{
                            position: "absolute",
                            top: position.top,
                            left: position.left,
                            width: position.width,
                            zIndex: 9999,
                            background: "#fff",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            borderRadius: 4,
                        }}
                    >
                        <Input.TextArea
                            value={value}
                            onChange={(e) => onChange?.(e.target.value)}
                            autoSize={{ minRows: 3, maxRows: 6 }}
                            autoComplete="off"
                            style={{ resize: "none" }}
                            onBlur={() => setFocused(false)}
                            autoFocus
                        />
                    </div>,
                    document.body
                )}
        </>
    );
};
