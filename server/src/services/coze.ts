import axios from 'axios';
import FormData = require('form-data');
import * as fs from 'fs';

const COZE_API_BASE = process.env.COZE_API_BASE || 'https://api.coze.cn';
const BOT_TOKEN = process.env.COZE_TOKEN;
const WORKFLOW_ID = process.env.COZE_WORKFLOW_ID;

export class CozeService {
    static async uploadFile(filePath: string): Promise<{ id: string; url: string } | null> {
        if (!BOT_TOKEN) throw new Error('COZE_TOKEN not configured');

        try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(filePath));

            const response = await axios.post(`${COZE_API_BASE}/v1/files/upload`, formData, {
                headers: {
                    'Authorization': `Bearer ${BOT_TOKEN}`,
                    ...formData.getHeaders()
                }
            });

            if (response.data?.code === 0 && response.data?.data) {
                console.log('Coze Upload Success:', response.data.data);
                return response.data.data; // { id, url, ... }
            }
            console.error('Coze Upload Error Response:', response.data);
            throw new Error(`Coze Upload Failed: ${response.data?.msg || 'Unknown error'} (Code: ${response.data?.code})`);
        } catch (error) {
            console.error('Coze Upload Exception:', error);
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(`Coze Upload Network Error: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    static async runWorkflow(jobDescription: string, files: { id: string; url?: string }[]): Promise<any> {
        if (!BOT_TOKEN || !WORKFLOW_ID) throw new Error('Coze config missing');

        console.log(`Starting Workflow ${WORKFLOW_ID} with ${files.length} files.`);

        const resumeList = files.map(f => {
            if (!f.url && !f.id) {
                console.warn('File object missing url and id:', f);
            }
            return {
                file_url: f.url || "", // Ensure string
                file_id: f.id || "",
                file_name: (f as any).file_name // Pass extra metadata if available
            };
        });

        const payload = {
            workflow_id: WORKFLOW_ID,
            parameters: {
                job_description: jobDescription,
                resume_list: resumeList
            }
        };

        try {
            console.log('Sending payload to Coze:', JSON.stringify(payload, null, 2));
            const response = await axios.post(`${COZE_API_BASE}/v1/workflow/run`, payload, {
                headers: {
                    'Authorization': `Bearer ${BOT_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Coze Workflow Response:', response.data);

            if (response.data?.code === 0) {
                if (response.data.interrupt_data) {
                    const interruptData = response.data.interrupt_data;
                    let innerData;
                    try {
                        innerData = JSON.parse(interruptData.data);
                    } catch (e) {
                        innerData = { data: interruptData.data };
                    }

                    if (innerData.need_auth && innerData.auth_info) {
                        const authUrl = innerData.auth_info;
                        throw new Error(`Coze Workflow User Auth Required: Please authorize the plugin. URL: ${authUrl}`);
                    }

                    throw new Error(`Coze Workflow Interrupted: ${JSON.stringify(interruptData)}`);
                }

                let resultData = response.data.data;

                if (!resultData) {
                    throw new Error('Coze Workflow execution succeeded but returned no data. Please ensure your Workflow has a "End" node and it is configured to output the result.');
                }

                if (typeof resultData === 'string') {
                    try {
                        resultData = JSON.parse(resultData);
                    } catch (e) {
                        console.warn('Failed to parse Coze data string, returning as is.', e);
                    }
                }
                return resultData;
            } else {
                console.error('Coze Workflow API Error:', response.data);
                throw new Error(response.data?.msg || `Workflow failed with code ${response.data?.code}`);
            }
        } catch (error) {
            console.error('Coze Run Failed:', error);
            if (axios.isAxiosError(error) && error.response) {
                console.error('Axios Response Data:', error.response.data);
                const errorMsg = error.response.data?.msg || error.message;
                throw new Error(`Coze API Error: ${errorMsg} - ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    static parseReport(reportMarkdown: string) {
        // Helper to extract candidate info for structured actions
        // Expecting sections like [FileUrl] (Score)
        // This is a "Best Effort" parser based on the prompt in the workflow.

        // Regex to find candidates with high scores (>= 85)
        // Since we don't have structured output, we might process on frontend or here.
        // Ideally we want structured data to "Add to Talent Pool".

        // TODO: Improve this with specific regex once we see real output.
        // For now, return raw report.
        return { raw: reportMarkdown };
    }
}
