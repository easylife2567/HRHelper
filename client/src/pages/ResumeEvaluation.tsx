import React, { useState, useEffect } from 'react';
import { Typography, Upload, TextArea, Button, Card, Toast, Spin } from '@douyinfe/semi-ui';
import { IconUpload, IconFile, IconDelete, IconHome } from '@douyinfe/semi-icons';
import { Breadcrumb } from '@arco-design/web-react';
import '@arco-design/web-react/dist/css/arco.css';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const { Title, Text } = Typography;

interface Candidate {
    name: string;
    email: string;
    score: number;
    summary: string;
    interviewQuestions?: string[];
    emailDraft?: any;
}

export const ResumeEvaluation: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [jobDescription, setJobDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<string>('');

    // Load persisted report on mount
    useEffect(() => {
        const savedReport = localStorage.getItem('resume_report');
        if (savedReport) {
            setReport(savedReport);
        }
    }, []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFileChange = (info: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fileList = info.fileList.map((f: any) => f.fileInstance);
        setFiles(fileList);
    };

    const handleClear = () => {
        setReport('');
        localStorage.removeItem('resume_report');
        Toast.info('已清除评估结果');
    };

    const handleAnalyze = async () => {
        if (files.length === 0 || !jobDescription) {
            Toast.warning('请上传简历并填写职位描述');
            return;
        }

        if (files.length > 10) {
            Toast.warning('最多只允许上传10份简历');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('jobDescription', jobDescription);
        files.forEach((file) => {
            formData.append('files', file);
        });

        try {
            const res = await axios.post('http://localhost:3000/api/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                const rawData = res.data.data;
                let parsedData: any = {};

                if (typeof rawData === 'string') {
                    try {
                        parsedData = JSON.parse(rawData);
                    } catch {
                        // Fallback if not JSON
                        parsedData = { final_report: rawData };
                    }
                } else {
                    parsedData = rawData;
                }

                // 1. Display Report
                const reportContent = parsedData.final_report || parsedData.data || JSON.stringify(parsedData);
                setReport(reportContent);
                localStorage.setItem('resume_report', reportContent);

                // 2. Process Output List for Talent Pool
                // New Structure: candidate_list, questions_list, email_draft_list
                const candidateList = parsedData.candidate_list || parsedData.output_list || [];
                const questionsList = parsedData.questions_list || [];
                const emailDraftList = parsedData.email_draft_list || [];

                if (Array.isArray(candidateList) && candidateList.length > 0) {
                    try {
                        let successCount = 0;
                        for (let i = 0; i < candidateList.length; i++) {
                            const item = candidateList[i];
                            const cName = item.candidate_name || item.name || '未知候选人';

                            // Find matching auxiliary data by candidate_name (preferred) or index (fallback)
                            let qItem = questionsList.find((q: any) => q.candidate_name === cName);
                            if (!qItem && questionsList[i] && !questionsList[i].candidate_name) qItem = questionsList[i];

                            let eItem = emailDraftList.find((e: any) => e.candidate_name === cName);
                            if (!eItem && emailDraftList[i] && !emailDraftList[i].candidate_name) eItem = emailDraftList[i];

                            // Normalize Questions to string array
                            let normalizedQs: string[] = [];
                            if (qItem) {
                                if (qItem.q1) normalizedQs.push(qItem.q1);
                                if (qItem.q2) normalizedQs.push(qItem.q2);
                                if (qItem.q3) normalizedQs.push(qItem.q3);
                            }

                            // Normalize Email Draft
                            let normalizedEmail = null;
                            if (eItem) {
                                normalizedEmail = {
                                    subject: eItem.subject,
                                    content: eItem.text || eItem.content
                                };
                            }

                            // Extract structured fields
                            const candidate: Candidate = {
                                name: cName,
                                email: item.email || '',
                                score: Number(item.overall_score || item.score) || 0,
                                summary: item.summary || 'AI自动评估',
                                // Attach generated content
                                interviewQuestions: normalizedQs.length > 0 ? normalizedQs : undefined,
                                emailDraft: normalizedEmail
                            };

                            if (candidate.name && candidate.email) {
                                await axios.post('http://localhost:3000/api/talent/add', candidate);
                                successCount++;
                            }
                        }

                        if (successCount > 0) {
                            Toast.success(`自动识别并添加了 ${successCount} 位候选人到人才库`);
                        }
                    } catch (e) {
                        console.error('Failed to sync talent pool', e);
                        Toast.warning('人才库同步部分失败');
                    }
                } else {
                    console.log('No candidate_list found in response', parsedData);
                }

                Toast.success('分析完成');
            }
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || '分析失败';
            const details = error.response?.data?.details || '';
            Toast.error(`${msg} ${details}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: 16 }}>
                <Breadcrumb>
                    <Breadcrumb.Item>
                        <IconHome />
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item>Resume Evaluation</Breadcrumb.Item>
                </Breadcrumb>
                <Title heading={3} style={{ marginTop: 12 }}>简历智能评估</Title>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, flex: 1, minHeight: 0 }}>
                {/* Left Panel: Configuration */}
                <Card
                    title="配置与上传"
                    style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                    bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20, overflowY: 'auto' }}
                    headerStyle={{ padding: '16px 20px' }}
                >
                    <Text strong style={{ display: 'block', marginBottom: 12 }}>1. 候选人简历</Text>
                    <Upload
                        action=""
                        beforeUpload={() => false}
                        onChange={onFileChange}
                        limit={10}
                        multiple
                        draggable
                        dragMainText="点击或拖拽上传文件"
                        dragSubText="支持 PDF/Word，最多 10 份"
                        style={{ width: '100%' }}
                    >
                        <div style={{
                            padding: '32px 0',
                            textAlign: 'center',
                            backgroundColor: 'var(--semi-color-fill-0)',
                            border: '1px dashed var(--semi-color-border)',
                            borderRadius: 'var(--semi-border-radius-medium)',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}>
                            <IconUpload size="extra-large" style={{ color: 'var(--semi-color-text-2)', marginBottom: 8 }} />
                            <div style={{ color: 'var(--semi-color-text-1)', fontWeight: 500 }}>点击或拖拽上传</div>
                            <div style={{ color: 'var(--semi-color-text-3)', fontSize: 12, marginTop: 4 }}>支持 PDF / Word</div>
                        </div>
                    </Upload>

                    <Text strong style={{ display: 'block', marginTop: 24, marginBottom: 12 }}>2. 职位描述 (JD)</Text>
                    <TextArea
                        style={{ flex: 1, resize: 'none', minHeight: 120 }} // Allow it to fill remaining space
                        value={jobDescription}
                        onChange={(val) => setJobDescription(val)}
                        placeholder="请粘贴详细的职位描述，以便AI更精准地匹配..."
                        showClear
                    />

                    <Button
                        theme="solid"
                        type="primary"
                        style={{ marginTop: 24, height: 48, fontSize: 16, fontWeight: 600 }}
                        block
                        loading={loading}
                        onClick={handleAnalyze}
                    >
                        {loading ? 'AI 正在分析...' : '开始智能评估'}
                    </Button>
                </Card>

                {/* Right Panel: Results */}
                <Card
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>评估报告</span>
                            {report && <span style={{ fontSize: 12, color: 'var(--semi-color-text-2)', fontWeight: 'normal' }}>已生成</span>}
                        </div>
                    }
                    headerExtraContent={report && <Button icon={<IconDelete />} theme="light" type="danger" onClick={handleClear} size="small">清除</Button>}
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    bodyStyle={{ flex: 1, overflow: 'hidden', padding: 0, position: 'relative' }} // Constraint overflow here
                    headerStyle={{ padding: '16px 24px' }}
                >
                    {/* Scrollable Content Area */}
                    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
                        {loading && (
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--semi-color-text-2)' }}>
                                <Spin size="large" />
                                <p style={{ marginTop: 24 }}>正在调用 AI 工作流进行深度分析...</p>
                                <p style={{ fontSize: 12, opacity: 0.6 }}>耗时可能需要 30-60 秒，请耐心等待</p>
                            </div>
                        )}

                        {!loading && !report && (
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--semi-color-text-3)' }}>
                                <div style={{ width: 120, height: 120, background: 'var(--semi-color-fill-0)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                                    <IconFile style={{ fontSize: 48 }} />
                                </div>
                                <Title heading={5} style={{ color: 'var(--semi-color-text-2)' }}>暂无分析结果</Title>
                                <Text type="tertiary" style={{ marginTop: 8 }}>请在左侧上传简历并填写 JD 后点击开始</Text>
                            </div>
                        )}

                        {!loading && report && (
                            <div className="markdown-body">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        table: ({ node, ...props }) => (
                                            <div style={{ overflowX: 'auto', margin: '16px 0', border: '1px solid var(--semi-color-border)', borderRadius: 8 }}>
                                                <table {...props} style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }} />
                                            </div>
                                        ),
                                        thead: ({ node, ...props }) => (
                                            <thead {...props} style={{ background: 'var(--semi-color-fill-0)' }} />
                                        ),
                                        th: ({ node, ...props }) => (
                                            <th {...props} style={{ padding: '14px 16px', borderBottom: '1px solid var(--semi-color-border)', textAlign: 'left', fontWeight: 600, color: 'var(--semi-color-text-0)', whiteSpace: 'nowrap' }} />
                                        ),
                                        td: ({ node, ...props }) => (
                                            <td {...props} style={{ padding: '14px 16px', borderBottom: '1px solid var(--semi-color-border)', color: 'var(--semi-color-text-1)' }} />
                                        ),
                                        h1: ({ node, ...props }) => <h1 {...props} style={{ margin: '32px 0 20px', fontSize: 28, fontWeight: 700, paddingBottom: 12, borderBottom: '1px solid var(--semi-color-border)' }} />,
                                        h2: ({ node, ...props }) => <h2 {...props} style={{ margin: '28px 0 16px', fontSize: 22, fontWeight: 600, color: 'var(--semi-color-text-0)', display: 'flex', alignItems: 'center' }}>{props.children}</h2>,
                                        h3: ({ node, ...props }) => <h3 {...props} style={{ margin: '20px 0 12px', fontSize: 18, fontWeight: 600 }} />,
                                        p: ({ node, ...props }) => <p {...props} style={{ margin: '0 0 16px', lineHeight: 1.7, color: 'var(--semi-color-text-1)', fontSize: 15 }} />,
                                        ul: ({ node, ...props }) => <ul {...props} style={{ paddingLeft: 24, marginBottom: 16 }} />,
                                        li: ({ node, ...props }) => <li {...props} style={{ marginBottom: 8, lineHeight: 1.7 }} />,
                                    }}
                                >
                                    {report}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};
