import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Input,
    Form,
    Card,
    Grid,
    Modal,
    Message,
    Space,
    Dropdown,
    Menu,
    Breadcrumb,
    Select,
    Radio
} from '@arco-design/web-react';
import { IconPlus, IconRefresh, IconSearch, IconDelete, IconEdit, IconDown, IconDownload, IconHome, IconEmail } from '@arco-design/web-react/icon';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import '@arco-design/web-react/dist/css/arco.css';
import { KanbanBoard } from '../components/KanbanBoard';

const { Row, Col } = Grid;
const FormItem = Form.Item;

export const TalentPool: React.FC = () => {
    // Use Store
    const { talentList, loadingTalents, fetchTalents } = useStore();
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [form] = Form.useForm();
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'create' | 'edit'>('create');
    const [currentRecord, setCurrentRecord] = useState<any>(null);
    const [modalForm] = Form.useForm();
    const [columns, setColumns] = useState<any[]>([]);
    const navigate = useNavigate();

    // View Mode State
    const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

    // Initial Fetch (Cached)
    useEffect(() => {
        fetchTalents();
    }, []);

    // Sync local filteredData with store data
    useEffect(() => {
        setFilteredData(talentList);
        if (talentList.length > 0) {
            generateColumns(talentList[0]);
        }
    }, [talentList]);

    const handleRefresh = () => {
        fetchTalents(true);
        Message.success('Refreshing data...');
    };

    const generateColumns = (sampleItem: any) => {
        const fixedKeys = ['candidate_name', 'phone_number', 'email', 'overall_score', 'status'];
        const ignoredKeys = [
            'id', 'record_id', 'interviewQuestions', 'emailDraft', 'questions_list', 'email_draft_list',
            'created_at', 'updated_at', 'name', 'file_url', 'upsert_key', 'score'
        ];

        const fieldLabels: Record<string, string> = {
            candidate_name: '候选人姓名',
            overall_score: '综合评分',
            status: '状态',
            email: '邮箱',
            summary: 'AI总结',
            phone_number: '联系方式',
            city: '城市',
            salary_expectation: '期望薪资',
            job_title: '应聘职位',
            work_experience: '工作经验',
            education: '学历',
            grade: '优先级'
        };

        const keys = Object.keys(sampleItem).filter(k => !ignoredKeys.includes(k));

        keys.sort((a, b) => {
            const indexA = fixedKeys.indexOf(a);
            const indexB = fixedKeys.indexOf(b);
            if (indexA > -1 && indexB > -1) return indexA - indexB;
            if (indexA > -1) return -1;
            if (indexB > -1) return 1;
            return 0;
        });

        const cols: any[] = keys.map(key => ({
            title: fieldLabels[key] || key,
            dataIndex: key,
            key: key,
            ellipsis: true,
            render: (col: any) => {
                if (typeof col === 'object') return JSON.stringify(col);
                return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={String(col)}>{col}</div>;
            }
        }));

        cols.push({
            title: '操作',
            dataIndex: 'op',
            key: 'op',
            width: 120,
            render: (_: any, record: any) => {
                const dropList = (
                    <Menu>
                        <Menu.Item key='email' onClick={() => handleSendEmail(record)}>
                            <IconEmail style={{ marginRight: 8 }} />
                            发送邮件
                        </Menu.Item>
                        <Menu.Item key='edit' onClick={() => handleEdit(record)}>
                            <IconEdit style={{ marginRight: 8 }} />
                            编辑
                        </Menu.Item>
                        <Menu.Item key='delete' onClick={() => {
                            Modal.confirm({
                                title: '确认删除',
                                content: '确定要删除这条记录吗？',
                                onOk: () => handleDelete(record.id)
                            });
                        }}>
                            <IconDelete style={{ marginRight: 8 }} />
                            删除
                        </Menu.Item>
                    </Menu>
                );

                return (
                    <Dropdown droplist={dropList} trigger={['click']} position='bl'>
                        <Button type='secondary' size='small'>
                            查看 <IconDown />
                        </Button>
                    </Dropdown>
                );
            },
        });

        setColumns(cols);
    };

    const handleSearch = () => {
        const values = form.getFieldsValue();
        const filtered = talentList.filter((item: any) => {
            let match = true;
            if (values.candidate_name && !item.candidate_name?.includes(values.candidate_name)) match = false;
            if (values.email && !item.email?.includes(values.email)) match = false;
            return match;
        });
        setFilteredData(filtered);
        Message.success(`查询到 ${filtered.length} 条结果`);
    };

    const handleReset = () => {
        form.resetFields();
        setFilteredData(talentList);
    };

    const handleSendEmail = (record: any) => {
        // Prefer the parsed 'emailDraft' object if available
        let subject = '';
        let content = '';

        if (record.emailDraft) {
            subject = record.emailDraft.subject || '';
            content = record.emailDraft.content || record.emailDraft.text || '';
        } else if (record.email_draft_list) {
            // Fallback: try to parse if it's a string (though it should be parsed by getCandidates)
            try {
                const parsed = typeof record.email_draft_list === 'string' ? JSON.parse(record.email_draft_list) : record.email_draft_list;
                subject = parsed.subject || '';
                content = parsed.content || parsed.text || '';
            } catch (e) {
                console.warn('Failed to parse email draft', e);
            }
        }

        // If no draft found, use default rejection message
        if (!subject && !content) {
            subject = '关于您的应聘反馈';
            content = '该候选人未能通过简历筛选';
        }

        navigate('/dashboard/email', {
            state: {
                to: record.email,
                subject: subject,
                content: content
            }
        });
    };

    const handleDownload = () => {
        if (filteredData.length === 0) {
            Message.warning('没有数据可导出');
            return;
        }

        // Generate CSV
        const header = columns.filter(c => c.key !== 'op').map(c => c.title).join(',') + '\n';
        const rows = filteredData.map(row => {
            return columns.filter(c => c.key !== 'op').map(c => {
                const val = row[c.dataIndex];
                // Escape quotes and commas
                const cell = String(val || '').replace(/"/g, '""');
                return `"${cell}"`;
            }).join(',');
        }).join('\n');

        const csvContent = "\uFEFF" + header + rows; // Add BOM for Excel UTF-8
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'candidates.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCreate = () => {
        setModalType('create');
        setCurrentRecord(null);
        modalForm.resetFields();
        setModalVisible(true);
    };

    const handleEdit = (record: any) => {
        setModalType('edit');
        setCurrentRecord(record);
        modalForm.setFieldsValue(record);
        setModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await axios.delete(`http://localhost:3000/api/talent/${id}`);
            if (res.data.success) {
                Message.success('删除成功');
                fetchTalents(true);
            } else {
                if (res.data.message && res.data.message.includes('Permission denied')) {
                    Message.error(res.data.message);
                } else {
                    Message.error('Delete failed: ' + res.data.message);
                }
            }
        } catch (e) {
            Message.error('Delete failed');
        }
    };

    const handleModalOk = async () => {
        try {
            const values = await modalForm.validate();
            if (modalType === 'create') {
                await axios.post('http://localhost:3000/api/talent/add', values);
                Message.success('Created successfully');
            } else {
                await axios.put(`http://localhost:3000/api/talent/${currentRecord.id}`, values);
                Message.success('Updated successfully');
            }
            setModalVisible(false);
            fetchTalents(true);
        } catch (e) {
            Message.error('Operation failed');
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        // 1. Optimistic Update: Immediately update local state
        const previousData = [...filteredData];
        const newData = filteredData.map(item =>
            item.id === id ? { ...item, status: newStatus } : item
        );
        setFilteredData(newData);

        try {
            // 2. Call API in background
            const res = await axios.put(`http://localhost:3000/api/talent/${id}`, { status: newStatus });

            if (res.data.success) {
                // 3. Success: Silently sync with server to ensure consistency
                // We don't show success message for every drag to keep it less noisy, or maybe just a subtle one?
                // Let's keep it clean or use a very lightweight notification if needed.
                // Message.success(`状态更新为: ${newStatus}`); 
                fetchTalents(true);
            } else {
                throw new Error('Update failed');
            }
        } catch (e) {
            // 4. Failure: Revert to previous state
            setFilteredData(previousData);
            Message.error('无法更新状态，操作已回滚');
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* ... Breadcrumb ... */}
            <Breadcrumb style={{ margin: '0 0 16px 0', flexShrink: 0 }}>
                <Breadcrumb.Item><IconHome /></Breadcrumb.Item>
                <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item>Talent Pool</Breadcrumb.Item>
            </Breadcrumb>

            {/* Search Form (Keep it visible for both views? Yes, helpful) */}
            <Card className='search-form-card' style={{ marginBottom: 20, flexShrink: 0 }}>
                {/* ... existing search form ... */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>人才管理</span>
                    <Radio.Group
                        type='button'
                        name='lang'
                        value={viewMode}
                        onChange={setViewMode}
                        options={[
                            { label: '列表视图', value: 'table' },
                            { label: '看板视图', value: 'kanban' },
                        ]}
                    />
                </div>
                {/* ... form content ... */}
                <Form form={form} layout="horizontal" labelCol={{ span: 5 }} wrapperCol={{ span: 19 }}>
                    <Row gutter={24}>
                        <Col span={8}>
                            <FormItem label="姓名" field="candidate_name">
                                <Input placeholder="请输入姓名" />
                            </FormItem>
                        </Col>
                        <Col span={8}>
                            <FormItem label="邮箱" field="email">
                                <Input placeholder="请输入邮箱" />
                            </FormItem>
                        </Col>
                        <Col span={8} style={{ textAlign: 'right' }}>
                            <Button type="primary" icon={<IconSearch />} onClick={handleSearch} style={{ marginRight: 12 }}>查询</Button>
                            <Button icon={<IconRefresh />} onClick={handleReset}>重置</Button>
                        </Col>
                    </Row>
                </Form>
            </Card>

            {/* Content Area */}
            {viewMode === 'table' ? (
                <Card
                    className="table-card"
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
                    bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px 24px' }}
                >
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
                        <Space>
                            <Button type="primary" icon={<IconPlus />} onClick={handleCreate}>新建</Button>
                            <Button icon={<IconRefresh />} onClick={handleRefresh}>刷新</Button>
                        </Space>
                        <Button icon={<IconDownload />} onClick={handleDownload}>下载</Button>
                    </div>

                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <Table
                            loading={loadingTalents}
                            data={filteredData}
                            columns={columns}
                            rowKey="id"
                            pagination={{ showTotal: true, pageSize: 10, sizeOptions: [10, 20, 50] }}
                            border={false}
                            scroll={{ y: true }}
                            style={{ height: '100%' }}
                        />
                    </div>
                </Card>
            ) : (
                <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, paddingBottom: 24 }}>
                    <KanbanBoard candidates={filteredData} onStatusChange={handleStatusChange} />
                </div>
            )}

            {/* ... Modal ... */}
            <Modal
                title={modalType === 'create' ? 'Create Candidate' : 'Edit Candidate'}
                visible={modalVisible}
                onOk={handleModalOk}
                onCancel={() => setModalVisible(false)}
                autoFocus={false}
            >
                {/* ... existing modal form ... */}
                <Form form={modalForm} layout="vertical">
                    <FormItem label="Name" field="candidate_name" rules={[{ required: true }]}>
                        <Input />
                    </FormItem>
                    <FormItem label="Email" field="email">
                        <Input />
                    </FormItem>
                    <FormItem label="Score" field="overall_score">
                        <Input type="number" />
                    </FormItem>
                    <FormItem label="Phone" field="phone_number">
                        <Input />
                    </FormItem>
                    <FormItem label="Summary" field="summary">
                        <Input.TextArea />
                    </FormItem>
                    <FormItem label="Status" field="status">
                        <Select options={['待面试', '通过', '未通过']} />
                    </FormItem>
                </Form>
            </Modal>
        </div >
    );
};
