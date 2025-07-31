"use client";

import axios from "axios";
import dayjs from "dayjs";
import ptBR from "dayjs/locale/pt-br";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  const [produtos, setProdutos] = useState([]);
  const [quantidadeProdutos, setQuantidadeProdutos] = useState([]);

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/produtos/bd?pagina=1"
        );
        setProdutos(response.data.produtos);
        setQuantidadeProdutos(response.data.quantidade_produtos);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      }
    };

    fetchProdutos();
  }, []);

  return (
    <div className="flex flex-col relative">
      <div className="flex flex-col w-full top-0 left-0 mx-auto py-10 pb-0 bg-slate-950/95 shadow-slate-950 shadow-2xl backdrop-blur-lg">
        <button className="absolute top-4 right-4 p-2 bg-white text-slate-950 rounded-sm cursor-pointer">
          Atualizar Dados
        </button>

        <div className="flex flex-col">
          <div className="w-full mt-4 mb-16">
            <div className="relative w-fit mx-auto text-zinc-100 text-5xl text-center">
              <h1 className="absolute -right-80 top-[50%] translate-y-[-50%] text-zinc-400/10 text-[8rem] z-0">
                {quantidadeProdutos}
              </h1>
              <p className="relative font-light z-10">
                <strong className="font-bold">Produtos</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full top-0 left-0 sticky border-t border-zinc-600 bg-slate-950/80 backdrop-blur-lg z-10 mb-0 py-10 justify-center">
        <div className="flex text-zinc-100/70 border-r border-zinc-600 px-20 cursor-pointer hover:text-white transition duration-300 ease-in-out">
          <p className="relative">
            <span className="flex absolute -right-4 top-[0] translate-y-[-50%] justify-center items-center bg-red-400 text-zinc-100 text-[0.785rem] px-1.5 py-1 z-0 w-6 h-6 rounded-full">
              35
            </span>
            <span className="uppercase text-lg">Sem imagens</span>
          </p>
        </div>

        <div className="flex text-zinc-100/70 border-r border-zinc-600 px-20 cursor-pointer hover:text-white transition duration-300 ease-in-out">
          <p className="relative">
            <span className="flex absolute -right-4 top-[0] translate-y-[-50%] justify-center items-center bg-red-400 text-zinc-100 text-[0.785rem] px-1.5 py-1 z-0 w-6 h-6 rounded-full">
              8
            </span>
            <span className="uppercase text-lg">Título incorreto</span>
          </p>
        </div>

        <div className="flex text-zinc-100/70 border-r border-zinc-600 px-20 cursor-pointer hover:text-white transition duration-300 ease-in-out last:border-r-0">
          <p className="relative">
            <span className="flex absolute -right-4 top-[0] translate-y-[-50%] justify-center items-center bg-red-400 text-zinc-100 text-[0.785rem] px-1.5 py-1 z-0 w-6 h-6 rounded-full">
              6
            </span>
            <span className="uppercase text-lg">Dimensões incorretas</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10 container mx-auto pt-10">
        {produtos.map((produto, key) => {
          const firstImage = produto.url_imagem.split("|")[0];

          return (
            <div
              id="box-produto"
              className="relative flex w-full mb-16 items-center"
              key={key}
            >
              <div className="relative flex bg-white box-image rounded-3xl translate-x-12 overflow-hidden max-w-36 max-h-36 cursor-pointer z-5">
                {/* <span className="absolute -top-6 -right-4 bg-slate-200 text-slate-700 p-[.8rem] font-bold border-2 rounded-full shadow-lg z-10">
                  50
                </span> */}
                <img
                  className="w-36 h-36 hover:scale-200 object-contain opacity-80 ease-in-out duration-300 p-2"
                  src={
                    firstImage && firstImage.length !== 0
                      ? firstImage
                      : "/next.svg"
                  }
                  alt=""
                  width={192}
                  height={192}
                />
                {/* <Image
                className="w-48"
                src="https://res.cloudinary.com/daruxsllg/image/upload/v1721918032/brk/1_xevdbj.png"
                alt=""
                width={192}
                height={192}
              /> */}
              </div>

              <div
                className={`flex flex-col relative w-full px-24 py-8 pb-24 border bg-slate-950/85 ${
                  produto.preco !== 159.9 && produto.nome.includes("Camisa")
                    ? "border-red-400/80 shadow-red-400 shadow-2xl"
                    : "border-slate-200/25"
                } rounded-lg`}
              >
                <span className="absolute -bottom-[1rem] -right-[0rem] text-9xl -tracking-widest font-bold text-stone-50/2">
                  {produto.estoque_atual ? produto.estoque_atual : "0"}
                </span>

                <div className="flex justify-between">
                  <span className="text-slate-200/40 font-medium -mb-6">
                    {produto.codigo}
                  </span>
                  <span className="text-slate-200/40 font-medium -mb-6">
                    {dayjs(produto.updatedAt)
                      .locale(ptBR)
                      .format("DD [de] MMMM [de] YYYY [às] HH:00[h]")}
                  </span>
                </div>
                <h3 className="text-slate-100/85 font-bold my-6 text-2xl leading-8 uppercase">
                  {produto.nome}
                </h3>

                <div className="flex flex-col gap-4 text-slate-200">
                  <div className="flex gap-4 justify-between">
                    <div className="flex flex-col">
                      <strong>Marca:</strong>{" "}
                      {produto.marca.length !== 0 ? produto.marca : "Sem marca"}
                    </div>
                    <div className="flex flex-col">
                      <strong>GTIN:</strong> {produto.gtin}
                    </div>
                    <div className="flex flex-col">
                      <strong>Descrição: </strong>
                      {produto.descricao.length === 0 ? (
                        <span className="text-red-400 font-bold">Vazia</span>
                      ) : (
                        <span className="text-green-400 font-bold shadow-2xl shadow-green-400">
                          Preenchida
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex">
                    <span className="flex w-full h-[.5px] bg-slate-200/20"></span>
                  </div>

                  <div className="flex gap-4 justify-between">
                    <div className="flex flex-col">
                      <strong>Peso:</strong> {produto.peso}
                    </div>
                    <div className="flex flex-col justify-between">
                      <strong>Profundidade:</strong> {produto.profundidade}
                    </div>
                    <div className="flex flex-col">
                      <strong>Largura:</strong> {produto.largura}
                    </div>
                    <div className="flex flex-col">
                      <strong>Altura:</strong> {produto.altura}
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 font-bold text-slate-100 bg-gradient-to-r from-zinc-700 to-zinc-800 py-4 px-10 border border-slate-100/15 rounded-lg shadow-lg">
                  <p>
                    <span>R$</span>
                    {produto.preco.toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra de pesquisa */}
      <div className="flex absolute bottom-0 z-10">
        <input type="text" name="" id="" placeholder="Procurar..." />
        <span>🔎</span>
      </div>

      {/* <h2 className="text-2xl font-bold mb-4">
        {produtos.length} Produtos
      </h2>

      <div className="container mx-auto mb-20 max-h-[80vh] overflow-y-auto">
        <Table className="">
          <TableCaption>Uma lista de produtos</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Imagem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead className="text-right">Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtos.map((produto, key) => (
              <TableRow key={key} className={`
                  ${
                    produto.codigo.includes('C0') 
                    && produto.preco !== '159,9' 
                    ? 'bg-red-100 text-red-400' 
                    : ''
                  }                  
                  `
                }>
                <TableCell className="font-medium">
                  <img src={produto.url_imagem && produto.url_imagem.length !== 0 ? produto.url_imagem : '/next.svg'} alt={produto.nome} className="w-10 h-10" />
                </TableCell>
                <TableCell>{produto.nome}</TableCell>
                <TableCell>R$ {produto.preco.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                {`
                  ${
                    produto.codigo.includes('C0') 
                    ? 'Camisa' 
                    : 
                      produto.nome.includes('Jaqu') 
                      ? 'Jaqueta' 
                      : ''
                  }
                  
                  `
                }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div> */}
    </div>
  );
}
