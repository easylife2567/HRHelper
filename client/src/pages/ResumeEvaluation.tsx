import React, { useState } from 'react';
import { Typography, Upload, Input, Button, Card, Message, Spin, Breadcrumb } from '@arco-design/web-react';
import { IconUpload, IconFile, IconDelete, IconHome } from '@arco-design/web-react/icon';
import '@arco-design/web-react/dist/css/arco.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStore } from '../store';

const { Title, Text } = Typography;
const TextArea = Input.TextArea;

export const ResumeEvaluation: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [jobDescription, setJobDescription] = useState('');

    // Global Store
    const { isAnalyzing, analysisReport, analyzeResume, clearAnalysis } = useStore();

    const onFileChange = (fileList: any[]) => {
        const rawFiles = fileList.map(f => f.originFile).filter(Boolean);
        setFiles(rawFiles);
    };

    const handleClear = () => {
        clearAnalysis();
        Message.info('已清除评估结果');
    };

    const handleAnalyze = async () => {
        if (files.length === 0 || !jobDescription) {
            Message.warning('请上传简历并填写职位描述');
            return;
        }

        if (files.length > 10) {
            Message.warning('最多只允许上传10份简历');
            return;
        }

        await analyzeResume(files, jobDescription);
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

            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, height: 'calc(100vh - 120px)', minHeight: 0 }}>
                {/* Left Panel: Configuration */}
                <Card
                    title="配置与上传"
                    style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                    bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20, overflowY: 'auto' }}
                    headerStyle={{ padding: '16px 20px' }}
                >
                    <Text bold style={{ display: 'block', marginBottom: 12 }}>1. 候选人简历</Text>
                    <Upload
                        autoUpload={false}
                        onChange={onFileChange}
                        limit={10}
                        multiple
                        drag
                        accept=".pdf,.doc,.docx"
                    >
                        <div style={{
                            padding: '32px 0',
                            textAlign: 'center',
                            backgroundColor: 'var(--color-fill-2)',
                            border: '1px dashed var(--color-border)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}>
                            <IconUpload style={{ fontSize: 48, color: 'var(--color-text-3)', marginBottom: 8 }} />
                            <div style={{ color: 'var(--color-text-1)', fontWeight: 500 }}>点击或拖拽上传</div>
                            <div style={{ color: 'var(--color-text-3)', fontSize: 12, marginTop: 4 }}>支持 PDF / Word，最多 10 份</div>
                        </div>
                    </Upload>

                    <Text bold style={{ display: 'block', marginTop: 24, marginBottom: 12 }}>2. 职位描述 (JD)</Text>
                    <TextArea
                        style={{ flex: 1, resize: 'none', minHeight: 120 }} // Allow it to fill remaining space
                        value={jobDescription}
                        onChange={(val) => setJobDescription(val)}
                        placeholder="请粘贴详细的职位描述，以便AI更精准地匹配..."
                    />

                    <Button
                        type="primary"
                        style={{ marginTop: 24, height: 48, fontSize: 16, fontWeight: 600 }}
                        long
                        loading={isAnalyzing}
                        onClick={handleAnalyze}
                    >
                        {isAnalyzing ? 'AI 正在分析...' : '开始智能评估'}
                    </Button>
                </Card>

                {/* Right Panel: Results */}
                <Card
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>评估报告</span>
                            {analysisReport && <span style={{ fontSize: 12, color: 'var(--color-text-3)', fontWeight: 'normal' }}>已生成</span>}
                        </div>
                    }
                    extra={analysisReport && <Button icon={<IconDelete />} status="danger" onClick={handleClear} size="small">清除</Button>}
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    bodyStyle={{ flex: 1, overflow: 'hidden', padding: 0, position: 'relative' }} // Constraint overflow here
                    headerStyle={{ padding: '16px 24px' }}
                >
                    {/* Scrollable Content Area */}
                    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
                        {isAnalyzing && (
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-text-3)' }}>
                                <Spin size={40} />
                                <p style={{ marginTop: 24 }}>正在调用 AI 工作流进行深度分析...</p>
                                <p style={{ fontSize: 12, opacity: 0.6 }}>耗时可能需要 30-60 秒，请耐心等待</p>
                            </div>
                        )}

                        {!isAnalyzing && !analysisReport && (
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-text-3)' }}>
                                <div style={{ width: 120, height: 120, background: 'var(--color-fill-2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                                    <IconFile style={{ fontSize: 48 }} />
                                </div>
                                <Title heading={5} style={{ color: 'var(--color-text-3)' }}>暂无分析结果</Title>
                                <Text type="secondary" style={{ marginTop: 8 }}>请在左侧上传简历并填写 JD 后点击开始</Text>
                            </div>
                        )}

                        {!isAnalyzing && analysisReport && (
                            <div className="markdown-body">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        table: ({ node, ...props }) => (
                                            <div style={{ overflowX: 'auto', margin: '16px 0', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                                                <table {...props} style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }} />
                                            </div>
                                        ),
                                        thead: ({ node, ...props }) => (
                                            <thead {...props} style={{ background: 'var(--color-fill-2)' }} />
                                        ),
                                        th: ({ node, ...props }) => (
                                            <th {...props} style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-1)', whiteSpace: 'nowrap' }} />
                                        ),
                                        td: ({ node, ...props }) => (
                                            <td {...props} style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-2)' }} />
                                        ),
                                        h1: ({ node, ...props }) => <h1 {...props} style={{ margin: '32px 0 20px', fontSize: 28, fontWeight: 700, paddingBottom: 12, borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-1)' }} />,
                                        h2: ({ node, ...props }) => <h2 {...props} style={{ margin: '28px 0 16px', fontSize: 22, fontWeight: 600, color: 'var(--color-text-1)', display: 'flex', alignItems: 'center' }}>{props.children}</h2>,
                                        h3: ({ node, ...props }) => <h3 {...props} style={{ margin: '20px 0 12px', fontSize: 18, fontWeight: 600, color: 'var(--color-text-1)' }} />,
                                        p: ({ node, ...props }) => <p {...props} style={{ margin: '0 0 16px', lineHeight: 1.7, color: 'var(--color-text-2)', fontSize: 15 }} />,
                                        ul: ({ node, ...props }) => <ul {...props} style={{ paddingLeft: 24, marginBottom: 16, color: 'var(--color-text-2)' }} />,
                                        li: ({ node, ...props }) => <li {...props} style={{ marginBottom: 8, lineHeight: 1.7 }} />,
                                    }}
                                >
                                    {analysisReport}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};
