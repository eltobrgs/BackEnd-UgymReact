import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { randomUUID } from 'crypto';

// Carrega as variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Verifica se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY devem estar definidos no arquivo .env');
}

// Cria o cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Faz upload de um arquivo para o Supabase Storage
 * @param {Buffer} fileBuffer - Buffer do arquivo
 * @param {string} fileName - Nome original do arquivo
 * @param {string} bucketName - Nome do bucket ('avatars' ou 'exercises-media')
 * @param {string} folderPath - Caminho da pasta dentro do bucket (opcional)
 * @returns {Promise<string>} URL pública do arquivo
 */
export async function uploadFile(fileBuffer, fileName, bucketName, folderPath = '') {
  try {
    // Gera um nome único para o arquivo para evitar conflitos
    const fileExtension = path.extname(fileName);
    const uniqueFileName = `${randomUUID()}${fileExtension}`;
    
    // Define o caminho completo do arquivo no bucket
    const filePath = folderPath 
      ? `${folderPath}/${uniqueFileName}` 
      : uniqueFileName;
    
    // Faz o upload do arquivo
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: getMimeType(fileExtension),
        upsert: false
      });
    
    if (error) {
      throw error;
    }
    
    // Obtém a URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error);
    throw error;
  }
}

/**
 * Obtém o tipo MIME com base na extensão do arquivo
 * @param {string} extension - Extensão do arquivo
 * @returns {string} Tipo MIME
 */
function getMimeType(extension) {
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime'
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Exclui um arquivo do Supabase Storage
 * @param {string} fileUrl - URL pública do arquivo
 * @param {string} bucketName - Nome do bucket ('avatars' ou 'exercises-media')
 * @returns {Promise<boolean>} Verdadeiro se a exclusão foi bem-sucedida
 */
export async function deleteFile(fileUrl, bucketName) {
  try {
    // Extrai o caminho do arquivo da URL pública
    const urlObj = new URL(fileUrl);
    const pathParts = urlObj.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf(bucketName) + 1).join('/');
    
    // Exclui o arquivo
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao excluir arquivo:', error);
    throw error;
  }
} 