import express = require('express');
import { MainController } from '../controllers/mainController';
import { upload } from '../index';

const router = express.Router();
router.get('/', (req, res) => {
    res.json({ message: 'HR Helper API is running' });
});
router.post('/login', MainController.login);
router.post('/analyze', upload.array('files', 10), MainController.uploadAndAnalyze);
router.post('/talent/add', MainController.addToTalentPool);
router.get('/talent/list', MainController.getTalentList);
router.put('/talent/:id', MainController.updateCandidate);
router.delete('/talent/:id', MainController.deleteCandidate);
router.post('/email/send', MainController.sendCustomEmail);

export default router;
