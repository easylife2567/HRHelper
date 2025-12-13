import React, { useMemo } from 'react';
import { DndContext, useDraggable, useDroppable, DragOverlay, closestCenter } from '@dnd-kit/core';
import { Card, Tag, Typography, Avatar, Empty } from '@arco-design/web-react';
import { IconUser } from '@arco-design/web-react/icon';

const { Text, Title } = Typography;

interface Candidate {
    id: string;
    name: string;
    email: string;
    score: number;
    grade: string;
    status: string;
    job_title?: string;
    avatar?: string;
}

interface KanbanBoardProps {
    candidates: Candidate[];
    onStatusChange: (id: string, newStatus: string) => void;
}

const COLUMNS = [
    { id: '待面试', title: '待面试', color: '#FF7D00' },
    { id: '面试中', title: '面试中', color: '#165DFF' },
    { id: '已通过', title: '已通过', color: '#00B42A' },
    { id: '已淘汰', title: '已淘汰', color: '#F53F3F' }
];

const DraggableCard = ({ candidate }: { candidate: Candidate }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: candidate.id,
        data: { candidate }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
        opacity: isDragging ? 0.5 : 1,
    } : undefined;

    const getScoreColor = (score: number) => {
        if (score >= 90) return '#F53F3F';
        if (score >= 75) return '#FF7D00';
        return '#165DFF';
    };

    return (
        <div ref={setNodeRef} style={{ marginBottom: 12, ...style }} {...listeners} {...attributes}>
            <Card
                hoverable
                style={{ cursor: 'grab', borderColor: 'var(--color-border-2)' }}
                bodyStyle={{ padding: 12 }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar size={32} style={{ backgroundColor: '#165DFF' }}>
                            {candidate.name ? candidate.name[0] : <IconUser />}
                        </Avatar>
                        <div style={{ marginLeft: 8 }}>
                            <Text bold>{candidate.name}</Text>
                            <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{candidate.job_title || '产品经理'}</div>
                        </div>
                    </div>
                    <Tag size="small" color={getScoreColor(candidate.score)}>
                        {candidate.score}分
                    </Tag>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{candidate.email}</div>
            </Card>
        </div>
    );
};

const DroppableColumn = ({ id, title, color, candidates }: { id: string, title: string, color: string, candidates: Candidate[] }) => {
    const { setNodeRef } = useDroppable({
        id: id,
    });

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 280, maxWidth: 350, height: '100%' }}>
            {/* Column Header */}
            <div style={{
                padding: '12px 16px',
                backgroundColor: 'var(--color-fill-2)',
                borderTop: `3px solid ${color}`,
                borderRadius: '4px 4px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8
            }}>
                <Text bold>{title}</Text>
                <Tag size="small" style={{ borderRadius: 10 }}>{candidates.length}</Tag>
            </div>

            {/* Drop Zone */}
            <div
                ref={setNodeRef}
                style={{
                    flex: 1,
                    backgroundColor: 'var(--color-fill-1)',
                    padding: 12,
                    borderRadius: 4,
                    overflowY: 'auto'
                }}
            >
                {candidates.map(c => <DraggableCard key={c.id} candidate={c} />)}
                {candidates.length === 0 && <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9CDD4' }}>暂无候选人</div>}
            </div>
        </div>
    );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ candidates, onStatusChange }) => {
    const [activeId, setActiveId] = React.useState<string | null>(null);
    const [activeCandidate, setActiveCandidate] = React.useState<Candidate | null>(null);

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
        setActiveCandidate(event.active.data.current.candidate);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (over && active.id && over.id) {
            // over.id is the Column ID (status)
            const newStatus = over.id;
            // Trigger update only if status changed
            if (activeCandidate && activeCandidate.status !== newStatus) {
                onStatusChange(active.id, newStatus);
            }
        }
        setActiveId(null);
        setActiveCandidate(null);
    };

    const columnsData = useMemo(() => {
        const data: Record<string, Candidate[]> = {
            '待面试': [], '面试中': [], '已通过': [], '已淘汰': []
        };

        candidates.forEach(c => {
            // Normalization
            let s = (c.status || '待面试').trim();
            if (!data[s]) s = '待面试'; // Fallback
            data[s].push(c);
        });
        return data;
    }, [candidates]);

    return (
        <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div style={{ display: 'flex', gap: 16, height: '100%', overflowX: 'auto', padding: 4 }}>
                {COLUMNS.map(col => (
                    <DroppableColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        color={col.color}
                        candidates={columnsData[col.id] || []}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeCandidate ? (
                    <Card
                        style={{ width: 280, cursor: 'grabbing', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
                        bodyStyle={{ padding: 12 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar size={32} style={{ backgroundColor: '#165DFF' }}>
                                    {activeCandidate.name ? activeCandidate.name[0] : <IconUser />}
                                </Avatar>
                                <div style={{ marginLeft: 8 }}>
                                    <Text bold>{activeCandidate.name}</Text>
                                </div>
                            </div>
                            <Tag size="small">
                                {activeCandidate.score}分
                            </Tag>
                        </div>
                    </Card>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};
