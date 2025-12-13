
import React, { useEffect, useState } from 'react';
import { Card, Typography, List, Tag, Empty } from '@arco-design/web-react';
import { IconMessage } from '@arco-design/web-react/icon';
import { useStore } from '../store';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const { Title, Text } = Typography;

export const InterviewQuestions: React.FC = () => {
    const { talentList, fetchTalents } = useStore();
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

    useEffect(() => {
        fetchTalents();
    }, []);

    // Deduplicate and Sort Candidates
    const processedCandidates = React.useMemo(() => {
        const unique = new Map();
        talentList.forEach((t: any) => {
            if (!unique.has(t.email)) {
                unique.set(t.email, t);
            }
        });

        return Array.from(unique.values()).sort((a: any, b: any) => {
            // Priority Sort: High score first
            return (b.score || 0) - (a.score || 0);
        });
    }, [talentList]);

    // Select first candidate by default
    useEffect(() => {
        if (!selectedCandidate && processedCandidates.length > 0) {
            const withQuestions = processedCandidates.find((c: any) => c.interviewQuestions && c.interviewQuestions.length > 0);
            setSelectedCandidate(withQuestions || processedCandidates[0]);
        }
    }, [processedCandidates]);

    const getGradeColor = (grade: string) => {
        if (!grade) return '#165DFF';
        const g = grade.toUpperCase();
        if (g.includes('S')) return '#F53F3F'; // Red
        if (g.includes('A')) return '#FF7D00'; // Orange
        if (g.includes('B')) return '#165DFF'; // Blue
        return '#86909C'; // Gray
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ marginBottom: 16 }}>
                <Title heading={3} style={{ marginTop: 0 }}>个性化面试题</Title>
            </div>

            <div style={{ flex: 1, display: 'flex', gap: 24, minHeight: 0 }}>
                {/* Left Sidebar: Candidate List */}
                <Card
                    style={{ width: 320, height: '100%', display: 'flex', flexDirection: 'column' }}
                    bodyStyle={{ padding: 0, flex: 1, overflowY: 'auto' }}
                    title={`候选人列表 (${processedCandidates.length})`}
                >
                    <List
                        dataSource={processedCandidates}
                        render={(item: any, index) => (
                            <List.Item
                                key={item.email}
                                style={{
                                    cursor: 'pointer',
                                    borderLeft: selectedCandidate?.email === item.email ? `4px solid ${getGradeColor(item.grade)}` : '4px solid transparent',
                                    backgroundColor: selectedCandidate?.email === item.email ? 'var(--color-fill-2)' : 'transparent',
                                    padding: '12px 16px'
                                }}
                                onClick={() => setSelectedCandidate(item)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text bold style={{ fontSize: 15 }}>{item.name}</Text>
                                    {item.grade ? (
                                        <Tag color={getGradeColor(item.grade)} size="small" bordered>
                                            {item.grade}
                                        </Tag>
                                    ) : (
                                        <Tag color={getGradeColor(item.score >= 90 ? 'S' : item.score >= 75 ? 'A' : 'B')} size="small" bordered>
                                            {/* Fallback if grade is missing */}
                                            {item.score >= 90 ? 'S' : item.score >= 75 ? 'A' : 'B'}级
                                        </Tag>
                                    )}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>{item.email}</Text>
                                    {item.interviewQuestions ? <IconMessage style={{ color: '#00B42A' }} /> : null}
                                </div>
                            </List.Item>
                        )}
                    />
                </Card>

                {/* Right Content: Questions */}
                <Card
                    style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}
                    bodyStyle={{ padding: 24, flex: 1, overflowY: 'auto' }}
                    title={selectedCandidate ? (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ marginRight: 12, fontWeight: 'bold' }}>{selectedCandidate.name}</div>
                            {selectedCandidate.grade && (
                                <Tag color={getGradeColor(selectedCandidate.grade)}>
                                    等级: {selectedCandidate.grade}
                                </Tag>
                            )}
                            <Tag style={{ marginLeft: 8 }}>
                                评分: {selectedCandidate.score}
                            </Tag>
                        </div>
                    ) : '面试题详情'}
                >
                    {selectedCandidate ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* Summary Card REMOVED as per request */}

                            {/* Questions List */}
                            {selectedCandidate.interviewQuestions && selectedCandidate.interviewQuestions.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {selectedCandidate.interviewQuestions.map((q: any, idx: number) => {
                                        // Handle both string and object formats
                                        // q can be a string, OR an object { category, difficulty, question, rationale }
                                        const isObject = typeof q === 'object' && q !== null;
                                        const questionText = isObject ? (q.question || JSON.stringify(q)) : q;
                                        const category = isObject ? q.category : null;
                                        const difficulty = isObject ? q.difficulty : null;
                                        const rationale = isObject ? q.rationale : null;

                                        return (
                                            <Card key={idx} bordered={true} hoverable style={{ borderColor: 'var(--color-border-2)' }}>
                                                <div style={{ display: 'flex', gap: 16 }}>
                                                    <div style={{
                                                        minWidth: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgb(var(--primary-6))',
                                                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14,
                                                        marginTop: -5
                                                    }}>
                                                        {idx + 1}
                                                    </div>
                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                        {/* Metadata Row */}
                                                        {(category || difficulty) && (
                                                            <div style={{ display: 'flex', gap: 8 }}>
                                                                {category && <Tag color="arcoblue" size="small">{category}</Tag>}
                                                                {difficulty && <Tag color="orange" size="small">{difficulty}</Tag>}
                                                            </div>
                                                        )}

                                                        {/* Question Text */}
                                                        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-1)', lineHeight: 1.5 }}>
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {questionText}
                                                            </ReactMarkdown>
                                                        </div>

                                                        {/* Rationale */}
                                                        {rationale && (
                                                            <div style={{
                                                                marginTop: 8,
                                                                padding: '8px 12px',
                                                                backgroundColor: 'var(--color-fill-2)',
                                                                borderRadius: 4,
                                                                fontSize: 13,
                                                                color: 'var(--color-text-2)'
                                                            }}>
                                                                <strong>考察意图：</strong> {rationale}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                <Empty description="该候选人暂无生成的面试题" />
                            )}
                        </div>
                    ) : (
                        <Empty description="请选择一位候选人查看面试题" />
                    )}
                </Card>
            </div>
        </div>
    );
};
