import React, { useState, useEffect } from 'react';
import { Card, Button, List, Toast, Typography, Empty, Space } from '@douyinfe/semi-ui';
import { IconCopy, IconDownload, IconComment, IconHome } from '@douyinfe/semi-icons';
import { useLocation } from 'react-router-dom';
import { Breadcrumb } from '@arco-design/web-react';
import '@arco-design/web-react/dist/css/arco.css';

const { Title, Text } = Typography;

export const InterviewQuestions: React.FC = () => {
    const location = useLocation();
    const [questions, setQuestions] = useState<any[]>([]);
    const [candidateName, setCandidateName] = useState('');

    useEffect(() => {
        if (location.state) {
            const state = location.state as any;
            if (state.candidate) {
                setCandidateName(state.candidate.name);
            }
            if (state.questions && Array.isArray(state.questions)) {
                setQuestions(state.questions);
            }
        }
    }, [location.state]);

    const handleCopy = () => {
        if (!questions.length) return;
        const text = questions.map((q, i) => {
            if (typeof q === 'string') return q;
            return `问题${i + 1}: ${q.question}\n类别: ${q.category || '通用'}\n难度: ${q.difficulty || '中'}\n考察点: ${q.rationale || ''}`;
        }).join('\n\n');

        navigator.clipboard.writeText(text).then(() => {
            Toast.success('面试题已复制到剪贴板');
        }).catch(() => {
            Toast.error('复制失败');
        });
    };

    const handleExport = () => {
        if (!questions.length) return;
        const text = questions.map((q, i) => {
            if (typeof q === 'string') return q;
            return `【问题${i + 1}】${q.question}\n[参考信息] 类别: ${q.category} | 难度: ${q.difficulty}\n[考察点] ${q.rationale}`;
        }).join('\n\n------------------------\n\n');

        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${candidateName}_面试题.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 40 }}>
            <Breadcrumb style={{ margin: '16px 0' }}>
                <Breadcrumb.Item>
                    <IconHome />
                </Breadcrumb.Item>
                <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item>Interview Questions</Breadcrumb.Item>
            </Breadcrumb>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title heading={2}>个性化面试题生成</Title>
                <Space>
                    <Button icon={<IconCopy />} onClick={handleCopy} disabled={questions.length === 0}>复制全部</Button>
                    <Button icon={<IconDownload />} theme="solid" type="primary" onClick={handleExport} disabled={questions.length === 0}>导出文件</Button>
                </Space>
            </div>

            <Card
                style={{ minHeight: 400 }}
                bodyStyle={{ padding: 24 }}
            >
                {questions.length === 0 ? (
                    <Empty
                        image={<IconComment style={{ fontSize: 48, color: 'var(--semi-color-text-2)' }} />}
                        description="暂无生成的面试题，请从人才库选择候选人生成"
                    />
                ) : (
                    <List
                        dataSource={questions}
                        renderItem={(item: any, index) => (
                            <List.Item style={{ padding: '24px 0', borderBottom: '1px solid var(--semi-color-border)' }}>
                                {typeof item === 'string' ? (
                                    <div style={{ fontSize: 16, lineHeight: 1.6 }}>{item}</div>
                                ) : (
                                    <div style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                background: 'var(--semi-color-primary)',
                                                color: '#fff',
                                                marginRight: 12,
                                                fontSize: 14,
                                                fontWeight: 'bold',
                                                flexShrink: 0
                                            }}>{index + 1}</span>
                                            <Text strong style={{ fontSize: 18, lineHeight: 1.4 }}>{item.question}</Text>
                                        </div>

                                        <div style={{ paddingLeft: 36 }}>
                                            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                                                {item.category && <span style={{ padding: '4px 12px', background: 'var(--semi-color-fill-0)', borderRadius: 6, fontSize: 13, color: 'var(--semi-color-text-1)' }}>类别: {item.category}</span>}
                                                {item.difficulty && <span style={{ padding: '4px 12px', background: 'var(--semi-color-fill-0)', borderRadius: 6, fontSize: 13, color: 'var(--semi-color-text-1)' }}>难度: {item.difficulty}</span>}
                                            </div>

                                            {item.rationale && (
                                                <div style={{ background: 'var(--semi-color-fill-0)', padding: 16, borderRadius: 8 }}>
                                                    <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>考察点 / 评分标准：</Text>
                                                    <Text style={{ color: 'var(--semi-color-text-1)' }}>{item.rationale}</Text>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </List.Item>
                        )}
                    />
                )}
            </Card>
        </div>
    );
};
