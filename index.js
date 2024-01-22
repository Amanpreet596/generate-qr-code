import express from 'express';
import qrcode from 'qrcode';
import * as fs from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const qrCodeFolderPath = join('public', 'assets', 'images');
app.use(express.static(join(__dirname)));

app.get('/', (req, res) => {
    res.send('App is working');
});

app.get('/generate-qr-code', async (req, res) => {
    try {
        const { walletAddress } = req.query;
        const existingImagePath = await findExistingQRCode(walletAddress);
        const baseURL = `${req.protocol}://${req.get('host')}`;

        if (existingImagePath) {
            res.send({ message: "old path returned", imagePath: `${baseURL}/${existingImagePath}` });
        } else {
            const qrCodeDataURL = await generateQRCode(walletAddress);
            const imagePath = await saveQRCodeImage(qrCodeDataURL, walletAddress);
            res.send({ message: "new path generated", imagePath: `${baseURL}/${imagePath}` });
        }

    } catch (err) {
        console.log(err);
        return res.status(200).json({ message: 'Something went wrong..!' });
    }
});

async function checkIfExists(path) {
    try {
        await fs.access(path);
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') {
            return false;
        } else {
            throw error;
        }
    }
}


async function findExistingQRCode(walletAddress) {
    try {
        const imagePath = join(qrCodeFolderPath, `qr_code_${walletAddress.toLowerCase()}.png`);
        return await checkIfExists(imagePath) ? imagePath : null;
    } catch (error) {
        console.log(error);
        return null;
    }
}

async function generateQRCode(data) {
    try {
        const qrCodeDataURL = await qrcode.toDataURL(data);
        return qrCodeDataURL;
    } catch (error) {
        throw error;
    }
}


async function saveQRCodeImage(dataURL, walletAddress) {
    try {
        if (!checkIfExists(qrCodeFolderPath)) {
            await fs.mkdir(qrCodeFolderPath, { recursive: true });
        }

        const filename = `qr_code_${walletAddress.toLowerCase()}.png`;

        const imagePath = join(qrCodeFolderPath, filename);

        await fs.writeFile(imagePath, dataURL.split(';base64,').pop(), { encoding: 'base64' });
        return imagePath;
    } catch (error) {
        console.log(error)
        throw error;
    }
}

app.listen(3000, () => {
    console.log('APP IS WORKING ON 3000 PORT..!');
});
