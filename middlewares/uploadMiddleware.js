import multer from 'multer';
import path from 'path';

// Configuração de armazenamento temporário
const storage = multer.memoryStorage();

// Função para filtrar tipos de arquivos permitidos
const fileFilter = (req, file, cb) => {
  // Lista de tipos MIME permitidos
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime' // .mov
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    // Aceita o arquivo
    cb(null, true);
  } else {
    // Rejeita o arquivo
    cb(new Error(`Tipo de arquivo não permitido. Tipos permitidos: ${allowedMimeTypes.join(', ')}`), false);
  }
};

// Configuração do multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limite de 10MB
  }
});

export default upload; 