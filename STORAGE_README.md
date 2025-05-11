# Sistema de Upload de Arquivos para UGym

Este documento descreve a implementação do sistema de upload de arquivos para o UGym, utilizando Supabase Storage.

## Configuração do Ambiente

Para utilizar o sistema de upload, é necessário configurar as seguintes variáveis de ambiente no arquivo `.env`:

```
# Configurações do Supabase
SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_ANON_KEY="sua_chave_anonima_do_supabase"
SUPABASE_SERVICE_KEY="sua_chave_de_servico_do_supabase"
```

## Criação dos Buckets

Para criar os buckets necessários no Supabase Storage, execute:

```bash
npm run create-buckets
```

Este comando criará os seguintes buckets:
- `avatars`: para armazenar fotos de perfil de alunos, personais e academias
- `exercises-media`: para armazenar imagens, GIFs e vídeos dos exercícios

## Endpoints Disponíveis

### Upload de Avatares

#### Upload de Avatar de Aluno (pelo próprio aluno)
```
POST /upload/avatar/aluno
```
- Requer autenticação do aluno
- Enviar um arquivo de imagem com o campo `avatar`

#### Upload de Avatar de Personal (pelo próprio personal)
```
POST /upload/avatar/personal
```
- Requer autenticação do personal
- Enviar um arquivo de imagem com o campo `avatar`

#### Upload de Avatar de Academia
```
POST /upload/avatar/academia
```
- Requer autenticação da academia
- Enviar um arquivo de imagem com o campo `avatar`

#### Upload de Avatar de Aluno (pela academia)
```
POST /upload/avatar/aluno/:alunoId
```
- Requer autenticação da academia
- O aluno deve pertencer à academia
- Enviar um arquivo de imagem com o campo `avatar`

#### Upload de Avatar de Personal (pela academia)
```
POST /upload/avatar/personal/:personalId
```
- Requer autenticação da academia
- O personal deve pertencer à academia
- Enviar um arquivo de imagem com o campo `avatar`

### Upload de Mídia para Exercícios

```
POST /upload/exercise-media
```
- Requer autenticação de personal ou academia
- Enviar um arquivo com o campo `media`
- Parâmetros adicionais:
  - `exercicioId`: ID do exercício
  - `tipo`: Tipo de mídia (`image`, `video` ou `gif`)

## Tipos de Arquivos Permitidos

- Imagens: JPEG, PNG, GIF, WebP
- Vídeos: MP4, WebM, MOV

## Limitações

- Tamanho máximo de arquivo: 10MB
- Os arquivos são armazenados em buckets públicos, mas com nomes aleatórios para evitar acesso não autorizado

## Estrutura de Pastas

- `avatars/`
  - `alunos/` - Avatares de alunos
  - `personais/` - Avatares de personais
  - `academias/` - Avatares de academias
- `exercises-media/`
  - `images/` - Imagens de exercícios
  - `videos/` - Vídeos de exercícios
  - `gifs/` - GIFs de exercícios

## Campos no Banco de Dados

Os seguintes campos foram adicionados ao banco de dados para armazenar as URLs das imagens:

- `PreferenciasAluno.alunoAvatar`: URL do avatar do aluno
- `PreferenciasPersonal.personalAvatar`: URL do avatar do personal
- `Academia.academiaAvatar`: URL do avatar da academia
- `Exercicio.image`: URL da imagem do exercício
- `Exercicio.videoUrl`: URL do vídeo do exercício
- `Exercicio.gifUrl`: URL do GIF do exercício 