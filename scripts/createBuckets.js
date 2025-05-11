import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Verifica se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: SUPABASE_URL e SUPABASE_SERVICE_KEY devem estar definidos no arquivo .env');
  process.exit(1);
}

// Cria o cliente Supabase com a chave de serviço
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para criar um bucket se ele não existir
async function createBucketIfNotExists(bucketName, isPublic = false) {
  try {
    // Verifica se o bucket já existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw listError;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      // Cria o bucket
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: isPublic,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (error) {
        throw error;
      }
      
      console.log(`✅ Bucket '${bucketName}' criado com sucesso!`);
    } else {
      console.log(`ℹ️ Bucket '${bucketName}' já existe.`);
    }
  } catch (error) {
    console.error(`❌ Erro ao criar bucket '${bucketName}':`, error.message);
  }
}

// Função principal
async function main() {
  console.log('Criando buckets no Supabase Storage...');
  
  // Cria os buckets necessários
  await createBucketIfNotExists('avatars', true); // Bucket público para avatares
  await createBucketIfNotExists('exercises-media', true); // Bucket público para mídias de exercícios
  
  console.log('Processo concluído!');
}

// Executa a função principal
main().catch(error => {
  console.error('Erro na execução do script:', error);
  process.exit(1);
}); 