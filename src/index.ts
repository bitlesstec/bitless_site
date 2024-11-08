import express, { Request, Response } from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 8080;

// Configura la carpeta de archivos estáticos (para Bootstrap y CSS)
app.use(express.static(path.join(__dirname, '../node_modules/bootstrap/dist')));
app.use(express.static(path.join(__dirname, 'views')));
// app.use(express.static(path.join(__dirname, 'js')));


app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));


// Configura la ruta principal
app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
    // res.redirect('/tilered');
});

app.get('/tilered', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'views/tilered.html'));
});

app.get('/spriter', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'views/spriter.html'));
});


app.listen(PORT, () => {
    console.log(`Server started... http://localhost:${PORT}`);
});