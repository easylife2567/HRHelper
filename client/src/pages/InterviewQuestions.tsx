import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, List, Message, Typography, Empty, Space, Breadcrumb, Menu, Badge, Avatar, Input } from '@arco-design/web-react';
import { IconCopy, IconDownload, IconMessage, IconHome, IconUser, IconSearch } from '@arco-design/web-react/icon';
import { useLocation } from 'react-router-dom';
import { useStore } from '../store';
import '@arco-design/web-react/dist/css/arco.css';

const { Title, Text } = Typography;
const MenuItem = Menu.Item;

export const InterviewQuestions: React.FC = () => {
    const location = useLocation();
    const { talentList, fetchTalents } = useStore();

    // State
    const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch data on mount if empty
    useEffect(() => {
        if (talentList.length === 0) {
            fetchTalents();
        }
    }, []);

    // Process Candidates: Dedup & Sort
    const processedCandidates = useMemo(() => {
        // 1. Deduplicate by Email (prefer items with questions)
        const uniqueMap = new Map();
        talentList.forEach((item: any) => {
            const key = item.email || item.candidate_name;
            if (!key) return;

            // If existing item has no questions but new one does, replace it
            const existing = uniqueMap.get(key);
            const hasQuestions = item.interviewQuestions && item.interviewQuestions.length > 0;

            if (!existing || (hasQuestions && (!existing.interviewQuestions || existing.interviewQuestions.length === 0))) {
                uniqueMap.set(key, item);
            }
        });

        const list = Array.from(uniqueMap.values());

        // 2. Sort by Grade (Priority)
        const gradeOrder: Record<string, number> = { 'S': 0, 'A': 1, 'B': 2, 'C': 3, 'D': 4 };
        return list.sort((a, b) => {
            const gradeA = gradeOrder[a.grade] ?? 99;
            const gradeB = gradeOrder[b.grade] ?? 99;
            if (gradeA !== gradeB) return gradeA - gradeB;
            // Fallback to score
            return (b.overall_score || 0) - (a.overall_score || 0);
        });
    }, [talentList]);

    // Filtered list for sidebar
    const filteredCandidates = useMemo(() => {
        return processedCandidates.filter(c =>
            c.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [processedCandidates, searchTerm]);

    // Handle initial selection from navigation
    useEffect(() => {
        if (location.state && location.state.candidate) {
            setSelectedCandidateId(location.state.candidate.id || location.state.candidate.record_id);
        } else if (processedCandidates.length > 0 && !selectedCandidateId) {
            // Optional: Auto-select first if none selected? 
            // Let's not auto-select to keep state clean, unless user wants it. 
            // But usually it's better to show empty state until clicked.
        }
    }, [location.state, processedCandidates]);

    const currentCandidate = processedCandidates.find(c => (c.id === selectedCandidateId || c.record_id === selectedCandidateId));
    const questions = currentCandidate?.interviewQuestions || [];

    const handleCopy = () => {
        if (!questions.length) return;
        const text = questions.map((q: any, i: number) => {
            if (typeof q === 'string') return q;
            return `问题${i + 1}: ${q.question}\n类别: ${q.category || '通用'}\n难度: ${q.difficulty || '中'}\n考察点: ${q.rationale || ''}`;
        }).join('\n\n');

        navigator.clipboard.writeText(text).then(() => {
            Message.success('面试题已复制到剪贴板');
        }).catch(() => {
            Message.error('复制失败');
        });
    };

    const handleExport = () => {
        if (!questions.length) return;
        const text = questions.map((q: any, i: number) => {
            if (typeof q === 'string') return q;
            return `【问题${i + 1}】${q.question}\n[参考信息] 类别: ${q.category} | 难度: ${q.difficulty}\n[考察点] ${q.rationale}`;
        }).join('\n\n------------------------\n\n');

        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${currentCandidate?.candidate_name || 'candidate'}_面试题.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'S': return '#f53f3f'; // Red
            case 'A': return '#ff7d00'; // Orange
            case 'B': return '#165dff'; // Blue
            case 'C': return '#86909c'; // Gray
            default: return 'var(--color-text-3)';
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Breadcrumb style={{ margin: '16px 0', flexShrink: 0 }}>
                <Breadcrumb.Item><IconHome /></Breadcrumb.Item>
                <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item>Interview Questions</Breadcrumb.Item>
            </Breadcrumb>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, flex: 1, minHeight: 0 }}>
                {/* Left Sidebar: Candidate List */}
                <Card
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    bodyStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                    title="人才库"
                >
                    <div style={{ padding: '20px 20px 12px 20px', borderBottom: '1px solid var(--color-border)' }}>
                        <Input prefix={<IconSearch />} placeholder="搜索候选人..." value={searchTerm} onChange={setSearchTerm} allowClear style={{ borderRadius: 8 }} />
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
                        <Menu
                            selectedKeys={[selectedCandidateId]}
                            onClickMenuItem={(key) => setSelectedCandidateId(key)}
                            style={{ width: '100%', border: 'none' }}
                        >
                            {filteredCandidates.map(item => (
                                <MenuItem key={item.id || item.record_id} style={{ height: 'auto', minHeight: '80px', padding: '8px 12px', marginBottom: 4, borderRadius: 8, lineHeight: '1.4' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', flex: 1, marginRight: 8 }}>
                                            <Avatar
                                                size={44}
                                                style={{ backgroundColor: getGradeColor(item.grade), marginRight: 14, flexShrink: 0 }}
                                            >
                                                {item.candidate_name ? item.candidate_name[0] : 'U'}
                                            </Avatar>
                                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                                <Text style={{ fontWeight: 600, fontSize: 16, marginBottom: 2, color: 'var(--color-text-1)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                    {item.candidate_name || 'Unknown'}
                                                </Text>
                                                <Text style={{ fontSize: 13, color: 'var(--color-text-3)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                    {item.job_title || '应聘者'}
                                                </Text>
                                            </div>
                                        </div>
                                        <Badge
                                            text={item.grade || 'N/A'}
                                            color={getGradeColor(item.grade)}
                                        />
                                    </div>
                                </MenuItem>
                            ))}
                            {filteredCandidates.length === 0 && (
                                <Empty description="无匹配结果" style={{ padding: 24 }} />
                            )}
                        </Menu>
                    </div>
                </Card>

                {/* Right Content: Questions */}
                <Card
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    bodyStyle={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}
                    title={
                        currentCandidate ? (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: 12, fontSize: 18, fontWeight: 600 }}>{currentCandidate.candidate_name} 的面试题</span>
                                {currentCandidate.grade && <Badge text={`${currentCandidate.grade}级`} color={getGradeColor(currentCandidate.grade)} />}
                            </div>
                        ) : '个性化面试题'
                    }
                    extra={
                        <Space>
                            <Button size="small" icon={<IconCopy />} onClick={handleCopy} disabled={!questions.length}>复制</Button>
                            <Button size="small" type="primary" icon={<IconDownload />} onClick={handleExport} disabled={!questions.length}>导出</Button>
                        </Space>
                    }
                >
                    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 60px 80px 60px' }}>
                        {!currentCandidate ? (
                            <Empty
                                icon={<IconUser style={{ fontSize: 64, color: 'var(--color-text-3)' }} />}
                                description="请从左侧选择一位候选人以查看面试题"
                                style={{ paddingTop: 120 }}
                            />
                        ) : questions.length === 0 ? (
                            <Empty
                                icon={<IconMessage style={{ fontSize: 64, color: 'var(--color-text-3)' }} />}
                                description="该候选人暂无生成的面试题"
                                style={{ paddingTop: 120 }}
                            />
                        ) : (
                            <List
                                dataSource={questions}
                                render={(item: any, index) => (
                                    <List.Item key={index} style={{ padding: '40px 0', borderBottom: '1px solid var(--color-border)' }}>
                                        {typeof item === 'string' ? (
                                            <div style={{ fontSize: 17, lineHeight: 1.8, color: 'var(--color-text-1)' }}>{item}</div>
                                        ) : (
                                            <div style={{ width: '100%' }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 20 }}>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        width: 36,
                                                        height: 36,
                                                        borderRadius: '50%',
                                                        background: 'rgb(var(--primary-6))',
                                                        color: '#fff',
                                                        marginRight: 24,
                                                        fontSize: 18,
                                                        fontWeight: 'bold',
                                                        flexShrink: 0,
                                                        boxShadow: '0 4px 10px rgba(var(--primary-6), 0.3)',
                                                        marginTop: 2 // Visual alignment with text cap height
                                                    }}>{index + 1}</span>
                                                    <Text bold style={{ fontSize: 20, lineHeight: 1.6, color: 'var(--color-text-1)', marginTop: 0 }}>{item.question}</Text>
                                                </div>

                                                <div style={{ paddingLeft: 60 }}>
                                                    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                                                        {item.category && <span style={{ padding: '4px 12px', background: 'var(--color-fill-2)', borderRadius: 6, fontSize: 13, color: 'var(--color-text-2)', fontWeight: 500 }}>类别: {item.category}</span>}
                                                        {item.difficulty && <span style={{ padding: '4px 12px', background: 'var(--color-fill-2)', borderRadius: 6, fontSize: 13, color: 'var(--color-text-2)', fontWeight: 500 }}>难度: {item.difficulty}</span>}
                                                    </div>

                                                    {item.rationale && (
                                                        <div style={{ background: 'var(--color-bg-2)', padding: '24px', borderRadius: 12, border: '1px solid var(--color-border)' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                                                <div style={{ width: 4, height: 16, background: 'rgb(var(--primary-6))', borderRadius: 2, marginRight: 8 }}></div>
                                                                <Text style={{ fontWeight: 'bold', fontSize: 14, color: 'var(--color-text-1)' }}>考察点 / 评分标准</Text>
                                                            </div>
                                                            <Text style={{ color: 'var(--color-text-2)', lineHeight: 1.8, fontSize: 15, paddingLeft: 12, display: 'block' }}>{item.rationale}</Text>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </List.Item>
                                )}
                            />
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};
