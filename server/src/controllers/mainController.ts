import express = require('express');
import nodemailer = require('nodemailer');
import { CozeService } from '../services/coze';
import { FeishuService } from '../services/feishu';

type Request = express.Request;
type Response = express.Response;

export class MainController {
    static async login(req: Request, res: Response) {
        const { username, password } = req.body;
        // Mock Login
        if (username === 'admin' && password === 'admin') {
            res.json({ token: 'mock-jwt-token', user: { name: 'HR Manager' } });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    }

    static async uploadAndAnalyze(req: Request, res: Response): Promise<void> {
        try {
            const files = req.files as Express.Multer.File[];
            const { jobDescription } = req.body;

            if (!files || files.length === 0) {
                res.status(400).json({ message: 'No files uploaded' });
                return;
            }

            // 1. Upload files to Coze
            const uploadedFiles = [];
            for (const file of files) {
                const result = await CozeService.uploadFile(file.path);
                if (result) {
                    uploadedFiles.push(result);
                }
            }

            if (uploadedFiles.length === 0) {
                res.status(500).json({ message: 'Failed to upload files to Coze' });
                return;
            }

            // 2. Run Workflow
            const workflowResult = await CozeService.runWorkflow(jobDescription, uploadedFiles);

            res.json({
                success: true,
                data: workflowResult
            });

        } catch (error) {
            console.error('Analysis Error:', error);

            let message = 'Analysis failed';
            let details = (error as any).response?.data || 'Unknown error';

            if (error instanceof Error) {
                message = error.message;
            }

            res.status(500).json({
                message: message,
                error: String(error),
                details: details
            });
        }
    }

    static async addToTalentPool(req: Request, res: Response) {
        try {
            const candidateData = req.body;
            // Expecting structured data: { name, email, score, file_url, ... }
            const result = await FeishuService.addCandidate(candidateData);
            res.json(result);
        } catch (error) {
            res.status(500).json({ message: 'Failed to add to Feishu', error: String(error) });
        }
    }

    static async getTalentList(req: Request, res: Response) {
        try {
            const list = await FeishuService.getCandidates();
            res.json({ success: true, data: list });
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch talents', error: String(error) });
        }
    }

    static async sendCustomEmail(req: Request, res: Response) {
        try {
            const { to, subject, content } = req.body;
            // TODO: Use nodemailer. For now, log and return success.
            console.log(`[Email Mock] To: ${to}, Subject: ${subject}`);
            res.json({ success: true, message: 'Email queued (mock)' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to send email', error: String(error) });
        }
    }
}
