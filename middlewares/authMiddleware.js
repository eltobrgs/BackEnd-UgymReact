import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateToken = (req, res, next) => {
    console.log("Middleware de autenticação chamado");

    const token = req.headers.authorization;
    console.log("Token recebido:", token);

    if (!token || !token.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token não fornecido ou malformado" });
    }

    try {
        const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET);
        console.log("Token decodificado:", decoded);

        // Atribui os dados do usuário para req.user
        req.user = {
            id: decoded.id,
            role: decoded.role
        };

        next(); // Chama o próximo middleware ou rota
    } catch (err) {
        console.error("Ocorreu um erro ao verificar o token:", err.message);
        return res.status(401).json({ error: "Token inválido" });
    }
};

export default authenticateToken; 