-- CreateTable
CREATE TABLE "Product" (
    "id" BIGSERIAL NOT NULL,
    "id_bling" BIGINT NOT NULL DEFAULT 0,
    "nome" TEXT,
    "codigo" TEXT,
    "descricao" TEXT,
    "preco" DOUBLE PRECISION NOT NULL,
    "tipo" TEXT,
    "situacao" TEXT,
    "formato" TEXT,
    "largura" DOUBLE PRECISION,
    "altura" DOUBLE PRECISION,
    "profundidade" DOUBLE PRECISION,
    "peso" DOUBLE PRECISION,
    "marca" TEXT,
    "tipo_producao" TEXT,
    "tipo_produto" TEXT,
    "url_imagem" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "codigo_fornecedor" TEXT NOT NULL,
    "descricao_complementar" TEXT,
    "descricao_produto_fornecedor" TEXT,
    "estoque_atual" INTEGER,
    "estoque_maximo" INTEGER,
    "estoque_minimo" INTEGER,
    "fornecedor" TEXT NOT NULL,
    "gtin" TEXT,
    "ncm" TEXT,
    "preco_custo" DOUBLE PRECISION NOT NULL,
    "produto_variacao" TEXT NOT NULL,
    "colecao" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product_variation" (
    "id" BIGSERIAL NOT NULL,
    "productId" BIGINT NOT NULL,
    "nome" TEXT,
    "codigo" TEXT,
    "descricao" TEXT,
    "preco" DOUBLE PRECISION NOT NULL,
    "tipo" TEXT,
    "situacao" TEXT,
    "formato" TEXT,
    "largura" DOUBLE PRECISION,
    "altura" DOUBLE PRECISION,
    "profundidade" DOUBLE PRECISION,
    "peso" DOUBLE PRECISION,
    "marca" TEXT,
    "tipo_producao" TEXT,
    "tipo_produto" TEXT,
    "url_imagem" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "codigo_fornecedor" TEXT,
    "descricao_complementar" TEXT,
    "descricao_produto_fornecedor" TEXT,
    "estoque_atual" INTEGER,
    "estoque_maximo" INTEGER,
    "estoque_minimo" INTEGER,
    "fornecedor" TEXT,
    "gtin" TEXT,
    "ncm" TEXT,
    "preco_custo" DOUBLE PRECISION NOT NULL,
    "produto_variacao" TEXT NOT NULL,
    "id_bling" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "Product_variation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_id_bling_key" ON "Product"("id_bling");

-- CreateIndex
CREATE UNIQUE INDEX "Product_codigo_key" ON "Product"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Product_variation_codigo_key" ON "Product_variation"("codigo");

-- AddForeignKey
ALTER TABLE "Product_variation" ADD CONSTRAINT "Product_variation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id_bling") ON DELETE RESTRICT ON UPDATE CASCADE;
