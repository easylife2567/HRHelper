import { create } from 'zustand';

interface User {
    name: string;
    token: string;
}

import axios from 'axios';

interface AppState {
    user: User | null;
    setUser: (user: User | null) => void;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;

    // Talent Cache
    talentList: any[];
    loadingTalents: boolean;
    fetchTalents: (force?: boolean) => Promise<void>;

    // Resume Analysis
    isAnalyzing: boolean;
    analysisReport: string;
    clearAnalysis: () => void;
    analyzeResume: (files: File[], jobDescription: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
    setUser: (user) => {
        if (user) localStorage.setItem('user', JSON.stringify(user));
        else localStorage.removeItem('user');
        set({ user });
    },
    isSidebarOpen: true,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

    talentList: [],
    loadingTalents: false,
    fetchTalents: async (force = false) => {
        const { talentList, loadingTalents } = get();
        if (!force && talentList.length > 0) return;
        if (loadingTalents) return;

        set({ loadingTalents: true });
        try {
            const res = await axios.get('http://localhost:3000/api/talent/list');
            const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
            set({ talentList: list, loadingTalents: false });
        } catch (error) {
            console.error('Failed to fetch talents', error);
            set({ loadingTalents: false });
        }
    },

    // Resume Analysis
    isAnalyzing: false,
    analysisReport: localStorage.getItem('resume_report') || '',
    clearAnalysis: () => {
        localStorage.removeItem('resume_report');
        set({ analysisReport: '' });
    },
    analyzeResume: async (files: File[], jobDescription: string) => {
        set({ isAnalyzing: true });
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
                        parsedData = { final_report: rawData };
                    }
                } else {
                    parsedData = rawData;
                }

                const reportContent = parsedData.final_report || parsedData.data || JSON.stringify(parsedData);
                set({ analysisReport: reportContent });
                localStorage.setItem('resume_report', reportContent);
                const candidateList = parsedData.candidate_list || parsedData.output_list || [];
                const questionsList = parsedData.questions_list || [];
                const emailDraftList = parsedData.email_draft_list || [];

                if (Array.isArray(candidateList) && candidateList.length > 0) {
                    try {
                        let successCount = 0;
                        for (let i = 0; i < candidateList.length; i++) {
                            const item = candidateList[i];
                            const cName = item.candidate_name || item.name || '未知候选人';

                            let qItem = questionsList.find((q: any) => q.candidate_name === cName);
                            if (!qItem && questionsList[i] && !questionsList[i].candidate_name) qItem = questionsList[i];

                            let eItem = emailDraftList.find((e: any) => e.candidate_name === cName);
                            if (!eItem && emailDraftList[i] && !emailDraftList[i].candidate_name) eItem = emailDraftList[i];

                            let normalizedQs: string[] = [];
                            if (qItem) {
                                if (qItem.q1) normalizedQs.push(qItem.q1);
                                if (qItem.q2) normalizedQs.push(qItem.q2);
                                if (qItem.q3) normalizedQs.push(qItem.q3);
                            }

                            let normalizedEmail = null;
                            if (eItem) {
                                normalizedEmail = {
                                    subject: eItem.subject,
                                    content: eItem.text || eItem.content
                                };
                            }

                            const candidate = {
                                name: cName,
                                email: item.email || '',
                                score: Number(item.overall_score || item.score) || 0,
                                summary: item.summary || 'AI自动评估',
                                interviewQuestions: normalizedQs.length > 0 ? normalizedQs : undefined,
                                emailDraft: normalizedEmail
                            };

                            if (candidate.name && candidate.email) {
                                await axios.post('http://localhost:3000/api/talent/add', candidate);
                                successCount++;
                            }
                        }

                        console.log(`Successfully added ${successCount} candidates`);
                    } catch (e) {
                        console.error('Failed to sync talent pool', e);
                    }
                }

                get().fetchTalents(true);
            }
        } catch (error: any) {
            console.error('Analysis failed', error);
        } finally {
            set({ isAnalyzing: false });
        }
    },
}));
