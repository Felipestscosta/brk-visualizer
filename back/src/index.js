import fastify from "fastify";
import cors from "@fastify/cors";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import path from "path";
import fs from "fs";

const app = fastify({ logger: true });
const prisma = new PrismaClient();

// Configuração do CORS
app.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
});

// Configuração do cliente Axios para o BLing
const blingClient = axios.create({
  baseURL: process.env.BLING_API_URL,
  headers: {
    Authorization: `Bearer ${process.env.BLING_API_KEY}`,
    "Content-Type": "application/json",
  },
});

// Função para atualizar o token de acesso
async function atualizarToken(falhaToken = false) {
  try {
    const credentials = `${process.env.BLING_CLIENT_ID}:${process.env.BLING_CLIENT_SECRET}`;
    const base64Credentials = Buffer.from(credentials).toString("base64");

    // console.log(`CREDENCIAIS NORMAIS: ${credentials}`);
    // console.log(`CREDENCIAIS CRIPTOGRAFADOS: ${base64Credentials}`);
    // console.log(`REFRESH TOKEN .ENV: ${process.env.BLING_REFRESH_TOKEN}`);

    const form = new FormData();
    form.append("grant_type", "refresh_token");
    form.append("refresh_token", process.env.BLING_REFRESH_TOKEN);

    const options = {
      method: "POST",
      url: `${process.env.BLING_API_URL}/oauth/token`,
      headers: {
        Authorization: `Basic ${base64Credentials}`,
        "Content-Type": "multipart/form-data",
      },
      data: form,
    };

    const response = await axios(options);
    if (response.data && response.data.access_token) {
      process.env.BLING_API_KEY = `${response.data.access_token}`;
      process.env.BLING_REFRESH_TOKEN = `${response.data.refresh_token}`;

      //Atualiza o arquivo .env
      const envPath = path.resolve(process.cwd(), ".env");
      let envContent = fs.readFileSync(envPath, "utf8");

      envContent = envContent.replace(
        /BLING_API_KEY=.*/,
        `BLING_API_KEY="${response.data.access_token}"`
      );

      envContent = envContent.replace(
        /BLING_REFRESH_TOKEN=.*/,
        `BLING_REFRESH_TOKEN="${response.data.refresh_token}"`
      );

      fs.writeFileSync(envPath, envContent);

      return response.data.access_token;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// Interceptor para lidar com tokens expirados
blingClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    console.log("------- CAINDO NO INTERCEPTADOR ---------");

    // Se o erro for 401 (não autorizado) e não for uma tentativa de refresh
    if (
      (error.response?.status === 401 || error.response?.status === 400) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await atualizarToken();
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return blingClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Rota de teste
app.get("/", async (request, reply) => {
  return { message: "API do BRK Visualizer está funcionando!" };
});

// Função para fazer a requisição com retry
async function fazerRequisicaoComRetry(url, maxRetries = 5) {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await blingClient.get(url);
      return response;
    } catch (error) {
      if (error.response?.status === 429) {
        retries++;
        const waitTime = Math.pow(2, retries) * 1000; // Backoff exponencial
        console.log(
          `Rate limit atingido. Aguardando ${
            waitTime / 1000
          } segundos antes de tentar novamente...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }

  throw new Error("Número máximo de tentativas excedido");
}

// Rota para buscar produtos
app.get("/sincronizar-produtos", async (request, reply) => {
  try {
    let pagina = 1;
    let temMaisPaginas = true;
    let produtosProcessados = new Set();
    let produtosVariacoesProcessados = new Set();
    var listaDeProdutos = [];
    var count = 0;
    var contagemDeProdutos = 1;

    //Definindo número de páginas e produtos totais
    console.log("Mensurando tempo de importação dos dados...");
    var countNumeroDeRequisicoes = 0;
    while (temMaisPaginas) {
      // a cada tres requisicoes, aguardar 4 segundos
      if (countNumeroDeRequisicoes === 3) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        countNumeroDeRequisicoes = 0;
      } else {
        countNumeroDeRequisicoes++;
      }

      const response = await fazerRequisicaoComRetry(
        `/produtos?pagina=${pagina}`
      );

      const produtos = response.data.data;
      listaDeProdutos.push(...produtos);

      if (!produtos || produtos.length === 0) {
        temMaisPaginas = false;
        break;
      }
      console.clear();
      console.log(`Nº de Produtos: ${listaDeProdutos.length}`);

      pagina++;
    }

    console.log(
      `Será importado o total de ${listaDeProdutos.length} produtos.`
    );

    // Para caso não exista mais produtos
    if (!listaDeProdutos || listaDeProdutos.length === 0) {
      console.log("Não há mais produtos para sincronizar");
      temMaisPaginas = false;
      return;
    }

    for (const produto of listaDeProdutos) {
      if (produtosProcessados.has(produto.codigo)) {
        continue;
      }

      // Verificar se o código já existe no banco de dados
      const produtoExistente = await prisma.product.findUnique({
        where: { codigo: produto.codigo },
      });

      if (!produtoExistente) {
        // a cada tres requisicoes, aguardar
        if (count === 3) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          count = 0;
        } else {
          count++;
        }

        const responseTodasAsInformacoes = await fazerRequisicaoComRetry(
          `/produtos/${produto.id}`
        );
        const produtoCompleto = responseTodasAsInformacoes.data.data;

        const arrayImagensProduto = [];
        for (const imagem of produtoCompleto.midia.imagens.externas) {
          arrayImagensProduto.push(imagem.link);
        }
        const url_imagens_produto = arrayImagensProduto.join("|");

        // apenas se o produtoCompleto.codigo não existir no banco de dados
        const produtoExistentePorIdBling = await prisma.product.findUnique({
          where: { id_bling: produtoCompleto.id },
        });

        if (
          !produtoExistentePorIdBling &&
          produtoCompleto.formato !== "E" &&
          produtoCompleto.formato !== "S"
        ) {
          await prisma.product.upsert({
            where: { codigo: produtoCompleto.codigo },
            update: {
              id_bling: produtoCompleto.id,
              nome: produtoCompleto.nome,
              codigo: produtoCompleto.codigo,
              codigo_fornecedor: produtoCompleto.fornecedor.codigo,
              produto_variacao: produtoCompleto.tipo,
              fornecedor: produtoCompleto.fornecedor.contato.nome,
              ncm: produtoCompleto.tributacao.ncm,
              descricao: produtoCompleto.descricaoCurta,
              descricao_produto_fornecedor: "",
              descricao_complementar: produtoCompleto.descricaoComplementar,
              preco: produtoCompleto.preco,
              preco_custo: produtoCompleto.fornecedor.precoCusto,
              tipo: produtoCompleto.tipo,
              estoque_atual: produtoCompleto.estoque
                ? produtoCompleto.estoque.saldoVirtualTotal
                : null,
              estoque_minimo: 0,
              estoque_maximo: 0,
              gtin: produtoCompleto.gtin,
              situacao: produtoCompleto.situacao,
              formato: produtoCompleto.formato,
              url_imagem: url_imagens_produto,
              largura: produtoCompleto.dimensoes.largura,
              altura: produtoCompleto.dimensoes.altura,
              profundidade: produtoCompleto.dimensoes.profundidade,
              peso: produtoCompleto.pesoLiquido,
              marca: produtoCompleto.marca,
            },
            create: {
              id_bling: produtoCompleto.id,
              nome: produtoCompleto.nome,
              codigo: produtoCompleto.codigo,
              codigo_fornecedor: produtoCompleto.fornecedor.codigo,
              produto_variacao: produtoCompleto.tipo,
              fornecedor: produtoCompleto.fornecedor.contato.nome,
              ncm: produtoCompleto.tributacao.ncm,
              descricao: produtoCompleto.descricaoCurta,
              descricao_produto_fornecedor: "",
              descricao_complementar: produtoCompleto.descricaoComplementar,
              preco: produtoCompleto.preco,
              preco_custo: produtoCompleto.fornecedor.precoCusto,
              tipo: produtoCompleto.tipo,
              estoque_atual: produtoCompleto.estoque
                ? produtoCompleto.estoque.saldoVirtualTotal
                : null,
              estoque_minimo: 0,
              estoque_maximo: 0,
              gtin: produtoCompleto.gtin,
              situacao: produtoCompleto.situacao,
              formato: produtoCompleto.formato,
              url_imagem: url_imagens_produto,
              largura: produtoCompleto.dimensoes.largura,
              altura: produtoCompleto.dimensoes.altura,
              profundidade: produtoCompleto.dimensoes.profundidade,
              peso: produtoCompleto.pesoLiquido,
              marca: produtoCompleto.marca,
            },
          });

          // Se produto for salvo com sucesso e sincronização de variações
          if (produtosProcessados.add(responseTodasAsInformacoes.codigo)) {
            if (produtoCompleto.formato === "V") {
              // console.log("Acessando Loop para salvar as variacoes");

              // para cada variacao, criar um novo produto
              for (const variacao of produtoCompleto.variacoes) {
                const idProdutoPai = variacao.variacao.produtoPai.id;

                const arrayImagensVariacao = [];
                for (const imagem of variacao.midia.imagens.externas) {
                  arrayImagensVariacao.push(imagem.link);
                }
                const url_imagens_variacao = arrayImagensVariacao.join("|");

                if (produtosVariacoesProcessados.has(variacao.codigo)) {
                  continue;
                }

                await prisma.product_variation.upsert({
                  where: { codigo: variacao.codigo },
                  update: {
                    productId: idProdutoPai,
                    id_bling: variacao.id,
                    nome: variacao.nome,
                    ncm: variacao.ncm,
                    codigo: variacao.codigo,
                    codigo_fornecedor: variacao.fornecedor.codigo,
                    produto_variacao: "Variação",
                    fornecedor: variacao.fornecedor.nome,
                    descricao: variacao.descricaoCurta
                      ? variacao.descricaoCurta
                      : variacao.descricaoComplementar,
                    descricao_produto_fornecedor: "",
                    descricao_complementar: variacao.descricaoComplementar,
                    preco: variacao.preco,
                    preco_custo: variacao.fornecedor.precoCusto,
                    tipo: variacao.tipo,
                    estoque_atual: variacao.estoque
                      ? variacao.estoque.saldoVirtualTotal
                      : null,
                    estoque_minimo: variacao.estoque.minimo,
                    estoque_maximo: variacao.estoque.maximo,
                    gtin: variacao.gtin,
                    situacao: variacao.situacao,
                    formato: variacao.formato,
                    url_imagem: url_imagens_variacao,
                    largura: variacao.dimensoes.largura,
                    altura: variacao.dimensoes.altura,
                    profundidade: variacao.dimensoes.profundidade,
                    peso: variacao.pesoLiquido,
                    marca: variacao.marca,
                  },
                  create: {
                    productId: idProdutoPai,
                    id_bling: variacao.id,
                    nome: variacao.nome,
                    ncm: variacao.ncm,
                    codigo: variacao.codigo,
                    codigo_fornecedor: variacao.fornecedor.codigo,
                    produto_variacao: "Variação",
                    fornecedor: variacao.fornecedor.nome,
                    descricao: variacao.descricaoCurta
                      ? variacao.descricaoCurta
                      : variacao.descricaoComplementar,
                    descricao_produto_fornecedor: "",
                    descricao_complementar: variacao.descricaoComplementar,
                    preco: variacao.preco,
                    preco_custo: variacao.fornecedor.precoCusto,
                    tipo: variacao.tipo,
                    estoque_atual: variacao.estoque
                      ? variacao.estoque.saldoVirtualTotal
                      : null,
                    estoque_minimo: variacao.estoque.minimo,
                    estoque_maximo: variacao.estoque.maximo,
                    gtin: variacao.gtin,
                    situacao: variacao.situacao,
                    formato: variacao.formato,
                    url_imagem: url_imagens_variacao,
                    largura: variacao.dimensoes.largura,
                    altura: variacao.dimensoes.altura,
                    profundidade: variacao.dimensoes.profundidade,
                    peso: variacao.pesoLiquido,
                    marca: variacao.marca,
                  },
                });

                if (produtosVariacoesProcessados.add(variacao.codigo)) {
                  // console.log(
                  //   `🚀Variacao ${variacao.codigo} salva com sucesso`
                  // );
                }
              }
            }

            console.clear();
            console.log(`${contagemDeProdutos}/${listaDeProdutos.length}`);
            contagemDeProdutos++;
          }
        } else {
          console.clear();
          console.log(`${contagemDeProdutos}/${listaDeProdutos.length}`);
          contagemDeProdutos++;
          console.log(`Produto -- ${produtoCompleto.id} -- já cadastrado.`);
        }
      } else {
        console.clear();
        console.log(`${contagemDeProdutos}/${listaDeProdutos.length}`);
        contagemDeProdutos++;
        console.log(`Produto -- ${produto.codigo} -- já cadastrado.`);
      }
    }

    return {
      message: "A sincronização dos produtos estão sendo processadas...",
      totalProdutos: produtosProcessados.size,
    };
  } catch (error) {
    app.log.error(error);
    reply.status(500).send({ error: "Erro ao buscar produtos" });
  }
});

// Rota para listar produtos do banco
app.get("/produtos/bd", async (request, reply) => {
  try {
    let pagina = 1;

    if (request.query.pagina) {
      pagina = parseInt(request.query.pagina);
      if (isNaN(pagina) || pagina < 1) {
        return reply
          .status(400)
          .send({ error: "O número da página deve ser um número positivo" });
      }
    }

    const produtos = await prisma.product.findMany({
      skip: (pagina - 1) * 28,
      take: 28,
      orderBy: {
        createdAt: "desc",
      },
      where: {
        formato: "V",
        codigo: {
          startsWith: "c0",
          mode: "insensitive",
        },
        NOT: [
          {
            codigo: {
              contains: "bl",
              mode: "insensitive",
            },
          },
          {
            codigo: {
              contains: "i",
              mode: "insensitive",
            },
          },
          {
            codigo: {
              contains: "_full",
              mode: "insensitive",
            },
          },
          {
            codigo: {
              contains: "_black",
              mode: "insensitive",
            },
          },
          {
            url_imagem: "",
          },
        ],
      },
    });

    const quantidade_produtos = await prisma.product.count();

    return {
      produtos: produtos.map((produto) => ({
        ...produto,
        id: produto.id.toString(),
        id_bling: produto.id_bling.toString(),
      })),
      quantidade_produtos,
    };
  } catch (error) {
    app.log.error(error);
    reply.status(500).send({ error: "Erro ao buscar produtos do banco" });
  }
});

app.get("/produtos/verificacodigo", async (request, reply) => {
  try {
    const { codigo } = request.query;

    const produtos = await prisma.product.findMany({
      where: {
        codigo: {
          contains: codigo,
        },
        AND: {
          OR: [
            {
              codigo: {
                contains: "bl",
                mode: "insensitive",
              },
            },
            {
              codigo: {
                contains: "i",
                mode: "insensitive",
              },
            },
          ],
        },
      },
    });

    return {
      produtos: produtos.map((produto) => ({
        ...produto,
        id: produto.id.toString(),
        id_bling: produto.id_bling.toString(),
      })),
    };
  } catch (error) {
    app.log.error(error);
    reply.status(500).send({ error: "Erro ao buscar produtos do banco" });
  }
});

// Rota para listar produtos do banco
app.get("/produtos", async (request, reply) => {
  try {
    let pagina = 1;
    if (request.query.pagina) {
      pagina = parseInt(request.query.pagina);
      if (isNaN(pagina) || pagina < 1) {
        return reply
          .status(400)
          .send({ error: "O número da página deve ser um número positivo" });
      }
    }

    const { colecao } = request.query;

    if (!colecao) {
      return reply
        .status(400)
        .send({ error: 'Parâmetro "colecao" é obrigatório' });
    }

    const produtos = await prisma.product.findMany({
      skip: (pagina - 1) * 24,
      take: 24,
      orderBy: {
        codigo: "desc",
      },
      where: {
        colecao: {
          contains: colecao,
          mode: "insensitive",
        },
        formato: "V",
        codigo: {
          startsWith: "c0",
          mode: "insensitive",
        },
        NOT: [
          {
            codigo: {
              contains: "bl",
              mode: "insensitive",
            },
          },
          {
            codigo: {
              contains: "i",
              mode: "insensitive",
            },
          },
          {
            codigo: {
              contains: "_full",
              mode: "insensitive",
            },
          },
          {
            codigo: {
              contains: "_black",
              mode: "insensitive",
            },
          },
          {
            url_imagem: "",
          },
        ],
      },
    });

    const quantidade_produtos = await prisma.product.count();

    return {
      produtos: produtos.map((produto) => ({
        ...produto,
        id: produto.id.toString(),
        id_bling: produto.id_bling.toString(),
      })),
      quantidade_produtos,
    };
  } catch (error) {
    app.log.error(error);
    reply.status(500).send({ error: "Erro ao buscar produtos do banco" });
  }
});

// Iniciar o servidor
const start = async () => {
  try {
    await app.listen({ port: process.env.PORT || 3000, host: "0.0.0.0" });
    app.log.info(
      `Servidor rodando em http://localhost:${process.env.PORT || 3000}`
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
