"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { AlignLeft, ChevronLeft, ChevronRight, X } from "lucide-react";

export default function catalogo() {
  const [produtoEmVisualizacao, setProdutoEmVisualizacao] = useState();
  const [menuAberto, setMenuAberto] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const searchParams = useSearchParams();
  const colecao = searchParams.get("colecao");
  var pagina = searchParams.get("pagina");
  const [paginaAtual, setPaginaAtual] = useState(pagina || 1);
  const [carregando, setCarregando] = useState(false);
  const elementoAncora = useRef(null);

  function rolaParaOTopo() {
    elementoAncora.current.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        if (colecao) {
          const response = await axios.get(
            `http://localhost:3000/produtos?colecao=${colecao}&pagina=${paginaAtual}`
          );
          setProdutos(response.data.produtos);
          setCarregando(false);
        } else {
          const response = await axios.get(
            `http://localhost:3000/produtos/bd?pagina=${paginaAtual}`
          );

          const todosProdutos = response.data.produtos;

          if (todosProdutos.length > 0) {
            const produtoComGenero = todosProdutos.map(async (produto) => {
              const buscaGeneros = await axios.get(
                `http://localhost:3000/produtos/verificacodigo?codigo=${produto.codigo}`
              );

              const generos = buscaGeneros.data.produtos;

              let possuiGeneroFeminino =
                generos.filter((genero) => {
                  return genero.codigo.includes("BL");
                }).length > 0
                  ? true
                  : false;
              let possuiGeneroInfantil =
                generos.filter((genero) => {
                  return genero.codigo.includes("I");
                }).length > 0
                  ? true
                  : false;

              return {
                ...produto,
                feminino: possuiGeneroFeminino,
                infantil: possuiGeneroInfantil,
              };
            });

            Promise.all(produtoComGenero).then((produtosResolvidos) => {
              setProdutos(produtosResolvidos);
              setCarregando(false);
            });
          }
        }
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      }
    };
    fetchProdutos();
  }, [paginaAtual]);

  return (
    <div className="flex relative overflow-hidden" ref={elementoAncora}>
      {/* Navegação páginas*/}
      <div className="flex">
        <span
          onClick={() => {
            setCarregando(true);
            setPaginaAtual(paginaAtual - 1);
            rolaParaOTopo();
          }}
          className="flex justify-center items-center position fixed left-0 z-50 h-30 w-15 top-[50%] -translate-y-[50%] bg-white/75 rounded-r-full hover:bg-white/100 shadow-2xl transition-all ease-in-out duration-500 cursor-pointer"
        >
          <ChevronLeft className="w-8 h-8 text-zinc-900 -translate-x-2" />
        </span>
        <span
          onClick={() => {
            setCarregando(true);
            setPaginaAtual(parseFloat(paginaAtual) + 1);
            rolaParaOTopo();
          }}
          className="flex justify-center items-center position fixed right-0 z-50 h-30 w-15 top-[50%] -translate-y-[50%] bg-white/75 rounded-l-full hover:bg-white/100 shadow-2xl transition-all ease-in-out duration-500 cursor-pointer"
        >
          <ChevronRight className="w-8 h-8 text-zinc-900 translate-x-2" />
        </span>
      </div>

      {/* Botão de abrir o Menu */}
      <div className="flex fixed h-[600px] w-[600px] -top-20 -left-20 bg-radial-[at_18%_18%] from-zinc-900 via-zinc-900/90 via-16% to-transparent to-70% z-10 "></div>
      <div className="fixed left-10 top-10 z-20">
        <AlignLeft
          className="w-10 h-10 cursor-pointer"
          onClick={() => {
            setMenuAberto(true);
          }}
        />
      </div>

      <div className="container flex-col mx-auto py-30 justify-center items-center">
        {/* Banner */}
        <div className="flex w-full max-h-fit fixed top-0 left-0">
          <div className="flex absolute w-full h-full left-0 top-0 bg-gradient-to-t from-zinc-950 to-transparent"></div>

          <Image
            className="flex w-full h-auto object-cover object-top"
            src={"/capa-catalogo-exemplo-sistema-bruto.webp"}
            width={1920}
            height={689}
            alt="Banner"
          />
        </div>

        {/* Conteúdo Menu */}
        <div
          className={`flex fixed top-0 ${
            menuAberto ? "left-0" : "-left-[100dvw]"
          } w-[100dvw] h-[100dvh] items-center justify-center bg-zinc-950/85 backdrop-blur-lg z-50 transition-all ease-in-out duration-700`}
        >
          <div className="absolute right-10 top-10">
            <X
              className="h-10 w-10 cursor-pointer"
              onClick={() => setMenuAberto(false)}
            />
          </div>

          <ul className="flex flex-col gap-10 flex-wrap uppercase font-bold text-4xl tracking-widest text-center">
            <li className="">
              <a href="/catalogo/">Lançamentos</a>
            </li>
            <li className="">
              <a href="/catalogo/?colecao=Agropecuária">Agropecuária</a>
            </li>
            <li className="">
              <a href="/catalogo/?colecao=Trator">Trator</a>
            </li>
            <li className="">
              <a href="/catalogo/?colecao=São Bento">São Bento</a>
            </li>
            <li className="">
              <a href="/catalogo/?colecao=Pecuária">Pecuária</a>
            </li>
          </ul>
        </div>

        {/* Grid de Produtos */}
        {carregando ? (
          <div className="grid mx-10 lg:mx-0 lg:mt-96 grid-cols-2 max-xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-20">
            <div
              className="
                    w-[300px] h-[455px]
                    flex
                    relative flex-col gap-1 rounded-[16px] lg:max-w-[300px]
                    transition-all ease-in-out duration-700
                    bg-zinc-300
                    animate-pulse
                    shadow-zinc-950/60 
                    shadow-lg py-10 cursor-pointer z-20"
            ></div>
            <div
              className="
                    w-[300px] h-[455px]
                    flex
                    relative flex-col gap-1 rounded-[16px] lg:max-w-[300px]
                    transition-all ease-in-out duration-700
                    bg-zinc-300
                    animate-pulse
                    shadow-zinc-950/60 
                    shadow-lg py-10 cursor-pointer z-20"
            ></div>
            <div
              className="
                    w-[300px] h-[455px]
                    flex
                    relative flex-col gap-1 rounded-[16px] lg:max-w-[300px]
                    transition-all ease-in-out duration-700
                    bg-zinc-300
                    animate-pulse
                    shadow-zinc-950/60 
                    shadow-lg py-10 cursor-pointer z-20"
            ></div>
            <div
              className="
                    w-[300px] h-[455px]
                    flex
                    relative flex-col gap-1 rounded-[16px] lg:max-w-[300px]
                    transition-all ease-in-out duration-700
                    bg-zinc-300
                    animate-pulse
                    shadow-zinc-950/60 
                    shadow-lg py-10 cursor-pointer z-20"
            ></div>
            <div
              className="
                    w-[300px] h-[455px]
                    flex
                    relative flex-col gap-1 rounded-[16px] lg:max-w-[300px]
                    transition-all ease-in-out duration-700
                    bg-zinc-300
                    animate-pulse
                    shadow-zinc-950/60 
                    shadow-lg py-10 cursor-pointer z-20"
            ></div>
            <div
              className="
                    w-[300px] h-[455px]
                    flex
                    relative flex-col gap-1 rounded-[16px] lg:max-w-[300px]
                    transition-all ease-in-out duration-700
                    bg-zinc-300
                    animate-pulse
                    shadow-zinc-950/60 
                    shadow-lg py-10 cursor-pointer z-20"
            ></div>
            <div
              className="
                    w-[300px] h-[455px]
                    flex
                    relative flex-col gap-1 rounded-[16px] lg:max-w-[300px]
                    transition-all ease-in-out duration-700
                    bg-zinc-300
                    animate-pulse
                    shadow-zinc-950/60 
                    shadow-lg py-10 cursor-pointer z-20"
            ></div>
            <div
              className="
                    w-[300px] h-[455px]
                    flex
                    relative flex-col gap-1 rounded-[16px] lg:max-w-[300px]
                    transition-all ease-in-out duration-700
                    bg-zinc-300
                    animate-pulse
                    shadow-zinc-950/60 
                    shadow-lg py-10 cursor-pointer z-20"
            ></div>
            <div
              className="
                    w-[300px] h-[455px]
                    flex
                    relative flex-col gap-1 rounded-[16px] lg:max-w-[300px]
                    transition-all ease-in-out duration-700
                    bg-zinc-300
                    animate-pulse
                    shadow-zinc-950/60 
                    shadow-lg py-10 cursor-pointer z-20"
            ></div>
            <div
              className="
                    w-[300px] h-[455px]
                    flex
                    relative flex-col gap-1 rounded-[16px] lg:max-w-[300px]
                    transition-all ease-in-out duration-700
                    bg-zinc-300
                    animate-pulse
                    shadow-zinc-950/60 
                    shadow-lg py-10 cursor-pointer z-20"
            ></div>
            <div
              className="
                    w-[300px] h-[455px]
                    flex
                    relative flex-col gap-1 rounded-[16px] lg:max-w-[300px]
                    transition-all ease-in-out duration-700
                    bg-zinc-300
                    animate-pulse
                    shadow-zinc-950/60 
                    shadow-lg py-10 cursor-pointer z-20"
            ></div>
            <div
              className="
                    w-[300px] h-[455px]
                    flex
                    relative flex-col gap-1 rounded-[16px] lg:max-w-[300px]
                    transition-all ease-in-out duration-700
                    bg-zinc-300
                    animate-pulse
                    shadow-zinc-950/60 
                    shadow-lg py-10 cursor-pointer z-20"
            ></div>
          </div>
        ) : (
          <div className="grid mx-10 lg:mx-0 lg:mt-96 grid-cols-2 max-xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-20">
            {produtos.map((produto, key) => {
              const firstImage =
                produto.url_imagem && produto.url_imagem.split("|")[0];
              if (firstImage.length !== 0) {
                return (
                  <div
                    className={`
                    flex 
                    ${
                      key === produtoEmVisualizacao
                        ? "flex flex-col fixed left-0 top-0 w-dvw h-dvh z-50 justify-center items-center"
                        : "relative flex-col gap-1 rounded-[16px] lg:max-w-[300px]"
                    }
                    transition-all ease-in-out duration-700
                    bg-white 
                    shadow-zinc-950/60 
                    shadow-lg py-10 cursor-pointer z-20`}
                    key={key}
                  >
                    <div
                      className={`absolute ${
                        key === produtoEmVisualizacao
                          ? "flex left-10 top-10 opacity-100"
                          : "hidden opacity-0"
                      } cursor-pointer`}
                      onClick={() => {
                        setProdutoEmVisualizacao(-1);
                      }}
                    >
                      <X className="h-10 w-10 text-zinc-950" />
                    </div>

                    <Image
                      className={`w-fit mx-auto object-cover ${
                        key === produtoEmVisualizacao
                          ? "max-h-[1200px] h-[90%]"
                          : "max-h-[300px]"
                      }`}
                      width={300}
                      height={300}
                      alt=""
                      src={firstImage}
                      onClick={() => {
                        setProdutoEmVisualizacao(key);
                      }}
                    />
                    {produto.feminino || produto.infantil ? (
                      <small className="hidden gap-2 my-1">
                        {produto.feminino && "Fem"}{" "}
                        {produto.feminino && produto.infantil ? "•" : ""}{" "}
                        {produto.infantil && "Masc"}
                      </small>
                    ) : null}
                    <div className="flex flex-col w-full px-4 py-1 rounded-b-[10px] text-zinc-950 text-center justify-center items-center font-bold text-[18px]">
                      <p className="mb-3">{produto.codigo}</p>
                      <div className="flex w-full justify-center">
                        <span className="flex text-zinc-950/60 pr-1 lg:pr-3 mr-1 lg:mr-3 border-r border-zinc-900/10 font-normal lg:text-1xl text-[12px] lg:text-[16px]">
                          Masc
                        </span>
                        {produto.feminino ? (
                          <span className="flex text-zinc-950/60 pr-1 lg:pr-3 mr-1 lg:mr-3 border-r border-zinc-900/10 font-normal lg:text-1xl text-[12px] lg:text-[16px]">
                            Fem
                          </span>
                        ) : null}
                        {produto.infantil ? (
                          <span className="flex text-zinc-950/60 font-normal lg:text-1xl text-[12px] lg:text-[16px]">
                            Inf
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
}
