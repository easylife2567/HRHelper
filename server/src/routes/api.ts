import express = require('express');
import { MainController } from '../controllers/mainController';
import { upload } from '../index';

const router = express.Router();

router.post('/login', MainController.login);
router.post('/analyze', upload.array('files', 10), MainController.uploadAndAnalyze);
router.post('/talent/add', MainController.addToTalentPool);
router.get('/talent/list', MainController.getTalentList);
router.post('/email/send', MainController.sendCustomEmail);

export default router;
