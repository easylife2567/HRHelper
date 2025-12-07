import React, { useState, useEffect } from 'react';
import { Typography, Upload, TextArea, Button, Card, Toast, Spin } from '@douyinfe/semi-ui';
import { IconUpload, IconFile, IconDelete } from '@douyinfe/semi-icons';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

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
        <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
            <Title heading={2} style={{ marginBottom: 24 }}>简历评估</Title>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
                <Card title="上传与配置">
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>1. 上传简历 (PDF/Word, 最多10份)</Text>
                    <Upload
                        action=""
                        beforeUpload={() => false}
                        onChange={onFileChange}
                        limit={10}
                        multiple
                        draggable
                    >
                        <div style={{ padding: 20, textAlign: 'center', border: '1px dashed var(--semi-color-border)', cursor: 'pointer' }}>
                            <IconUpload size="extra-large" />
                            <Text style={{ display: 'block', marginTop: 8 }}>点击或拖拽上传简历</Text>
                        </div>
                    </Upload>

                    <Text strong style={{ display: 'block', marginTop: 24, marginBottom: 8 }}>2. 职位描述 (JD)</Text>
                    <TextArea
                        rows={10}
                        value={jobDescription}
                        onChange={(val) => setJobDescription(val)}
                        placeholder="请输入职位描述..."
                    />

                    <Button
                        theme="solid"
                        type="primary"
                        style={{ marginTop: 24 }}
                        block
                        loading={loading}
                        onClick={handleAnalyze}
                        size="large"
                    >
                        开始智能评估
                    </Button>
                </Card>

                <Card
                    title="评估结果"
                    headerExtraContent={report && <Button icon={<IconDelete />} theme="light" type="danger" onClick={handleClear}>清除结果</Button>}
                    style={{ minHeight: 600, overflow: 'auto' }}
                >
                    {loading && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                            <Spin size="large" tip="正在调用AI工作流进行分析..." />
                        </div>
                    )}

                    {!loading && !report && (
                        <div style={{ textAlign: 'center', color: 'var(--semi-color-text-2)', marginTop: 100 }}>
                            <IconFile size="extra-large" />
                            <p>暂无分析结果</p>
                        </div>
                    )}

                    {!loading && report && (
                        <div className="markdown-body" style={{ padding: '0 10px' }}>
                            <ReactMarkdown>{report}</ReactMarkdown>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};
