import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Search,
  X,
  Check,
  BookOpen,
  Shuffle,
  SlidersHorizontal,
  Orbit,
  List,
  ChevronDown,
  CheckCheck,
  ExternalLink,
} from "lucide-react";
import lessons from "./data/lessons.json";
import categories from "./data/categories.json";

type Lesson = (typeof lessons)[number];
const lessonSections = [
  ["entender", "01 / Entenda"],
  ["exemplos", "02 / Compare"],
  ["cotidiano", "03 / Veja no cotidiano"],
  ["limites", "04 / Diferencie"],
  ["pratica", "05 / Aplique"],
  ["exercicios", "06 / Teste o aprendizado"],
];
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const categoryFor = (l: Lesson) =>
  categories.find((c) => c.id === l.placements[0].category)!;
function getSaved(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem("entrelinhas-learned") || "[]");
    return Array.isArray(v)
      ? v.filter(
          (id: unknown) =>
            typeof id === "string" && lessons.some((l) => l.id === id),
        )
      : [];
  } catch {
    return [];
  }
}
function Mark() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <ellipse cx="20" cy="20" rx="7" ry="17" />
      <ellipse cx="20" cy="20" rx="7" ry="17" transform="rotate(60 20 20)" />
      <ellipse cx="20" cy="20" rx="7" ry="17" transform="rotate(120 20 20)" />
    </svg>
  );
}
function Atlas({ onSelect }: { onSelect: (id: string) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const [mapFocus, setMapFocus] = useState(0);
  const mapRoot = useRef<SVGSVGElement>(null);
  const mapItems = categories.flatMap((c) =>
    lessons
      .filter((l) => l.placements.some((p) => p.category === c.id))
      .map((l) => `${c.id}-${l.id}`),
  );
  const radii = [91, 129, 168, 207];
  return (
    <div className="atlas-visual">
      <svg
        ref={mapRoot}
        viewBox="0 0 490 490"
        role="group"
        aria-label="Mapa dos vieses. Use as setas para percorrer os pontos e Enter para abrir uma explicação."
      >
        <g transform="translate(245 245)">
          {radii.map((r, i) => (
            <circle
              key={r}
              r={r}
              fill="none"
              stroke={categories[i].color}
              strokeOpacity=".2"
            />
          ))}
          {categories.map((c, ci) => {
            const items = lessons.filter((l) =>
              l.placements.some((p) => p.category === c.id),
            );
            return (
              <g key={c.id}>
                {items.map((l, i) => {
                  const a = (i / items.length) * Math.PI * 2 - Math.PI / 2;
                  const r = radii[ci];
                  const x = Math.cos(a) * r,
                    y = Math.sin(a) * r;
                  const mapIndex = mapItems.indexOf(`${c.id}-${l.id}`);
                  return (
                    <g
                      key={l.id}
                      className="map-dot"
                      role="button"
                      aria-label={`${l.name} — ${c.title}`}
                      tabIndex={mapFocus === mapIndex ? 0 : -1}
                      data-map-index={mapIndex}
                      onFocus={() => {
                        setMapFocus(mapIndex);
                        setHover(l.name);
                      }}
                      onBlur={() => setHover(null)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelect(l.id);
                        } else if (
                          [
                            "ArrowRight",
                            "ArrowDown",
                            "ArrowLeft",
                            "ArrowUp",
                            "Home",
                            "End",
                          ].includes(e.key)
                        ) {
                          e.preventDefault();
                          const next =
                            e.key === "Home"
                              ? 0
                              : e.key === "End"
                                ? mapItems.length - 1
                                : (mapIndex +
                                    (["ArrowRight", "ArrowDown"].includes(e.key)
                                      ? 1
                                      : -1) +
                                    mapItems.length) %
                                  mapItems.length;
                          setMapFocus(next);
                          mapRoot.current
                            ?.querySelector<SVGGElement>(
                              `[data-map-index="${next}"]`,
                            )
                            ?.focus();
                        }
                      }}
                      onMouseEnter={() => setHover(l.name)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => onSelect(l.id)}
                    >
                      <title>
                        {l.name} — {c.title}
                      </title>
                      <line
                        x1={Math.cos(a) * (r - 9)}
                        y1={Math.sin(a) * (r - 9)}
                        x2={x}
                        y2={y}
                        stroke={c.color}
                        opacity=".4"
                      />
                      <circle cx={x} cy={y} r="7" fill="transparent" />
                      <circle
                        cx={x}
                        cy={y}
                        r={i % 7 === 0 ? 3.8 : 2.5}
                        fill={c.color}
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}
          <circle r="57" fill="#f7f8ee" />
          <text textAnchor="middle" y="2" className="map-number">
            188
          </text>
          <text textAnchor="middle" y="23" className="map-label">
            JEITOS DE PENSAR
          </text>
        </g>
      </svg>
      <div className="map-caption">
        {hover || "Cada ponto, uma perspectiva. Explore o atlas abaixo."}
      </div>
      <span className="map-coordinate" aria-hidden="true">
        MAPA COGNITIVO / 01—04
      </span>
    </div>
  );
}
function LessonView({
  lesson,
  onClose,
  onNext,
  done,
  onComplete,
}: {
  lesson: Lesson;
  onClose: () => void;
  onNext: () => void;
  done: boolean;
  onComplete: () => void;
}) {
  const cat = categoryFor(lesson);
  const [answer, setAnswer] = useState<number | null>(null);
  const [reflection, setReflection] = useState("");
  const [revealed, setRevealed] = useState(false);
  const correctIndex = lesson.id.length % 2;
  const options =
    correctIndex === 0
      ? [lesson.correct, lesson.incorrect]
      : [lesson.incorrect, lesson.correct];
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, [lesson.id]);
  return (
    <main
      id="conteudo"
      className="lesson-page"
      style={
        {
          "--category": cat.color,
          "--category-light": cat.light,
        } as CSSProperties
      }
    >
      <div className="lesson-top">
        <button onClick={onClose} className="text-button">
          <ArrowLeft size={18} /> Voltar ao atlas
        </button>
        <span>
          {done ? (
            <>
              <CheckCheck size={16} /> Estudo concluído
            </>
          ) : (
            <>
              <BookOpen size={16} /> {lesson.readingMinutes} min de leitura +
              prática
            </>
          )}
        </span>
      </div>
      <div className="lesson-layout">
        <aside className="lesson-aside">
          <span className="eyebrow">NO MAPA</span>
          {lesson.placements.map((p) => {
            const c = categories.find((c) => c.id === p.category)!;
            return (
              <div key={p.category}>
                <strong style={{ color: c.color }}>{c.title}</strong>
                <p>{c.groups[p.group]}</p>
              </div>
            );
          })}
          <nav aria-label="Nesta explicação">
            {lessonSections.map(([id, label]) => (
              <a key={id} href={`#${id}`}>
                {label}
              </a>
            ))}
          </nav>
        </aside>
        <article>
          <span className="eyebrow lesson-kicker">
            UMA AULA, VÁRIOS JEITOS DE RECONHECER
          </span>
          <h1 ref={heading} tabIndex={-1}>
            {lesson.name}
          </h1>
          <p className="original-name">{lesson.originalName}</p>
          {lesson.aliases.length > 0 && (
            <p className="lesson-aliases">
              <strong>Outros nomes e termos de busca:</strong>{" "}
              {lesson.aliases.join(" · ")}
            </p>
          )}
          {lesson.termNote && (
            <details className="term-note">
              <summary>Sobre o nome em português</summary>
              <p>{lesson.termNote}</p>
            </details>
          )}
          <details className="mobile-lesson-toc">
            <summary>
              Nesta aula <span>6 etapas</span>
            </summary>
            <nav aria-label="Navegar pela aula">
              {lessonSections.map(([id, label]) => (
                <a key={id} href={`#${id}`}>
                  {label}
                </a>
              ))}
            </nav>
          </details>
          <div className="lesson-roadmap">
            <BookOpen size={22} aria-hidden="true" />
            <div>
              <strong>Entender, reconhecer e praticar.</strong>
              <p>
                Leia o mecanismo, compare situações e teste a compreensão em
                dois cenários novos. Os exemplos são ilustrações educativas.
              </p>
            </div>
          </div>
          <section id="entender">
            <h2>O que acontece na nossa cabeça?</h2>
            <p className="explanation">{lesson.explanation}</p>
            <div className="lesson-prose">
              {lesson.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
          <section id="exemplos">
            <h2>O mesmo mecanismo. Dois caminhos.</h2>
            <div className="examples">
              <div className="example wrong">
                <span>
                  <X size={16} /> Quando vira uma armadilha
                </span>
                <p>{lesson.wrong}</p>
              </div>
              <div className="example right">
                <span>
                  <Check size={16} /> Uma forma mais cuidadosa
                </span>
                <p>{lesson.right}</p>
              </div>
            </div>
          </section>
          <section id="cotidiano" className="lesson-prose">
            <span className="eyebrow">DO CONCEITO À SITUAÇÃO REAL</span>
            <h2>Mais dois exemplos, passo a passo.</h2>
            {lesson.cases.map((example, i) => (
              <div className="worked-example" key={example}>
                <span className="case-number">0{i + 1}</span>
                <p>{example}</p>
              </div>
            ))}
          </section>
          <section id="limites" className="lesson-prose distinction">
            <span className="eyebrow">PARA NÃO CONFUNDIR</span>
            <h2>Onde o conceito começa — e termina.</h2>
            <p>{lesson.distinction}</p>
          </section>
          <section id="pratica" className="practice">
            <div className="practice-icon">
              <ArrowUpRight size={25} />
            </div>
            <div>
              <span className="eyebrow">LEVE PARA O DIA A DIA</span>
              <h2>Um roteiro para experimentar</h2>
              <p>{lesson.practice}</p>
              <ol className="practice-steps">
                {lesson.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </section>
          <div className="lesson-takeaway">
            <span className="eyebrow">GUARDE ESTA IDEIA</span>
            <p>{lesson.takeaway}</p>
          </div>
          <section id="exercicios" className="quiz">
            <div className="quiz-title">
              <span className="eyebrow">DA LEITURA À COMPREENSÃO</span>
              <span>02 questões</span>
            </div>
            <h2>Agora, mude o cenário.</h2>
            <p className="quiz-intro">
              Situações novas para testar o que ficou.
            </p>
            <fieldset>
              <legend>
                <span className="question-number">01</span>
                {lesson.question}
              </legend>
              <div className="options">
                {options.map((option, i) => (
                  <button
                    key={option}
                    disabled={answer !== null}
                    className={`option ${answer === i ? "chosen" : ""} ${answer !== null && i === correctIndex ? "is-correct" : ""}`}
                    onClick={() => setAnswer(i)}
                  >
                    <span>{String.fromCharCode(65 + i)}</span>
                    {option}
                    {answer !== null && i === correctIndex && (
                      <Check size={18} />
                    )}
                  </button>
                ))}
              </div>
            </fieldset>
            {answer !== null && (
              <div
                className={`feedback ${answer === correctIndex ? "success" : ""}`}
                role="status"
              >
                <strong>
                  {answer === correctIndex
                    ? "Isso mesmo."
                    : "Vale ajustar o raciocínio."}
                </strong>
                <p>{lesson.feedback}</p>
                {answer !== correctIndex && (
                  <button
                    className="text-button"
                    onClick={() => setAnswer(null)}
                  >
                    Tentar novamente <ArrowRight size={15} />
                  </button>
                )}
              </div>
            )}
            <div className="reflection">
              <label htmlFor="reflection">
                <span className="question-number">02</span>
                {lesson.transfer}
              </label>
              <textarea
                id="reflection"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Explique com suas palavras…"
                rows={3}
              />
              <p className="input-hint">
                Sua resposta fica apenas nesta tela. Compare seu raciocínio com
                a referência.
              </p>
              <button
                className="secondary-button"
                disabled={!reflection.trim()}
                onClick={() => setRevealed(true)}
              >
                Comparar minha resposta <ChevronDown size={16} />
              </button>
              {revealed && (
                <div className="feedback success" role="status">
                  <strong>Resposta de referência</strong>
                  <p>{lesson.reference}</p>
                  <p>
                    Você identificou o mecanismo e propôs uma ação concreta? Não
                    é preciso usar as mesmas palavras.
                  </p>
                </div>
              )}
            </div>
            <div className="complete-row">
              <button
                className="primary-button"
                disabled={answer !== correctIndex || !revealed}
                onClick={onComplete}
              >
                {done ? (
                  <>
                    <CheckCheck size={17} /> Concluído
                  </>
                ) : (
                  <>
                    Concluir este estudo <Check size={17} />
                  </>
                )}
              </button>
              <small>
                {done
                  ? "Progresso salvo neste navegador."
                  : "Responda corretamente à primeira questão e compare a segunda."}
              </small>
            </div>
          </section>
          <div className="lesson-bottom">
            <a href={lesson.sourceUrl} target="_blank" rel="noreferrer">
              Consultar referência <ExternalLink size={14} />
            </a>
            <button className="text-button" onClick={onNext}>
              Próximo viés <ArrowRight size={18} />
            </button>
          </div>
          {lesson.references.length > 0 && (
            <section
              className="lesson-references"
              aria-label="Fontes da revisão"
            >
              <h2>Para aprofundar e conferir</h2>
              <p>
                Referências para o conceito, seus limites ou a nomenclatura em
                português. Os exemplos desta aula são ilustrações originais.
              </p>
              <ul>
                {lesson.references.map((ref) => (
                  <li key={ref.url}>
                    <a href={ref.url} target="_blank" rel="noreferrer">
                      {ref.title} <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </div>
    </main>
  );
}
export default function App() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [group, setGroup] = useState("all");
  const [mode, setMode] = useState<"cards" | "groups">("cards");
  const [saved, setSaved] = useState<string[]>(getSaved);
  const [onlyPending, setOnlyPending] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const currentId = () =>
    new URLSearchParams(window.location.search).get("vies");
  const [selected, setSelected] = useState<string | null>(currentId);
  const [sources, setSources] = useState(
    new URLSearchParams(window.location.search).has("sobre"),
  );
  const searchRef = useRef<HTMLInputElement>(null);
  const returnId = useRef<string | null>(null);
  useEffect(() => {
    const pop = () => {
      setSelected(currentId());
      setSources(new URLSearchParams(window.location.search).has("sobre"));
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    const l = lessons.find((x) => x.id === selected);
    document.title = sources
      ? "Sobre o projeto — Entrelinhas"
      : l
        ? `${l.name} — Entrelinhas`
        : "Entrelinhas — Atlas dos vieses cognitivos";
  }, [selected, sources]);
  const open = (id: string) => {
    returnId.current = id;
    history.pushState({}, "", `?vies=${id}`);
    setSelected(id);
    setSources(false);
  };
  const close = () => {
    setSources(false);
    history.pushState({}, "", window.location.pathname);
    setSelected(null);
    requestAnimationFrame(() =>
      document.getElementById(`card-${returnId.current}`)?.focus(),
    );
  };
  const showAbout = () => {
    history.pushState({}, "", "?sobre=1");
    setSources(true);
    setSelected(null);
    window.scrollTo(0, 0);
  };
  const complete = (id: string) => {
    const next = [...new Set([...saved, id])];
    setSaved(next);
    try {
      localStorage.setItem("entrelinhas-learned", JSON.stringify(next));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  };
  const lesson = lessons.find((l) => l.id === selected);
  const changeCategory = (id: string) => {
    setCategory(id);
    setGroup("all");
  };
  const filtered = lessons.filter(
    (l) =>
      l.placements.some(
        (p) =>
          (category === "all" || p.category === category) &&
          (group === "all" || p.group === Number(group)),
      ) &&
      (!onlyPending || !saved.includes(l.id)) &&
      normalize(
        `${l.name} ${l.aliases.join(" ")} ${l.originalName} ${l.explanation}`,
      ).includes(normalize(query)),
  );
  const random = () => {
    const candidates = lessons.filter((l) => !saved.includes(l.id));
    const pool = candidates.length ? candidates : lessons;
    open(pool[Math.floor(Math.random() * pool.length)].id);
  };
  const card = (l: Lesson) => {
    const cat = categoryFor(l);
    return (
      <button
        key={l.id}
        id={`card-${l.id}`}
        className="bias-card"
        style={
          {
            "--category": cat.color,
            "--category-light": cat.light,
          } as CSSProperties
        }
        onClick={() => open(l.id)}
      >
        <div className="card-meta">
          <span>
            <i />
            {cat.title}
          </span>
          {saved.includes(l.id) ? (
            <CheckCheck size={16} aria-label="Concluído" />
          ) : (
            <span className="card-index">
              {String(lessons.indexOf(l) + 1).padStart(3, "0")}
            </span>
          )}
        </div>
        <h3>{l.name}</h3>
        <p>{l.explanation}</p>
        <div className="card-bottom">
          <span>Entender & praticar</span>
          <ArrowUpRight size={19} />
        </div>
      </button>
    );
  };
  return (
    <>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <header className="site-header">
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setSources(false);
            close();
          }}
        >
          <Mark />
          <span>
            entrelinhas<span className="brand-caption">UM ATLAS DA MENTE</span>
          </span>
        </a>
        <nav aria-label="Principal">
          <button
            className={!sources ? "active" : ""}
            onClick={() => {
              setSources(false);
              close();
            }}
          >
            Explorar o atlas
          </button>
          <button className={sources ? "active" : ""} onClick={showAbout}>
            Sobre o projeto
          </button>
        </nav>
        <div className="header-progress">
          <span className="progress-orbit">
            <BookOpen size={17} />
          </span>
          <span>
            <strong>{saved.length}</strong>
            <span className="progress-total"> / {lessons.length}</span>
            <small>estudos concluídos</small>
          </span>
        </div>
      </header>
      {sources ? (
        <main id="conteudo" className="about-page">
          <span className="eyebrow">POR TRÁS DO ATLAS</span>
          <h1>
            Pensar melhor começa
            <br />
            por se <em>observar.</em>
          </h1>
          <p>
            Entrelinhas é uma adaptação educativa, em português brasileiro, do
            Cognitive Bias Codex de 2016. O mapa organiza atalhos mentais em
            quatro problemas que nossa mente tenta resolver.
          </p>
          <h2>Um mapa, não um diagnóstico</h2>
          <p>
            As categorias ajudam a explorar o tema; não são uma classificação
            clínica. O diagrama reúne vieses, falácias, heurísticas e efeitos de
            memória. Nem todo efeito é prejudicial, universal ou igualmente
            sustentado por evidências. Exemplos são ilustrações criadas para
            aprendizagem, não resultados de experimentos.
          </p>
          <h2>Fidelidade à imagem</h2>
          <p>
            Preservamos 189 posições, em 20 subgrupos, com 188 nomes distintos.
            O viés da negatividade ocupa duas categorias e compartilha a mesma
            explicação. Sinônimos como Forer/Barnum e ilusão de
            frequência/Baader–Meinhof mantêm entradas próprias, como na imagem.
            A versão anexada contém o efeito Delmore, ausente em algumas
            revisões posteriores.
          </p>
          <h2>Fontes e créditos</h2>
          <p>
            Os nomes foram revisados para o português brasileiro, com variantes
            de uso acadêmico e corrente. Não existe um vocabulário único para
            todos os itens: quando a revisão não encontrou uma denominação
            consolidada, a aula identifica o nome como descritivo. Os termos
            originais e os nomes anteriores continuam pesquisáveis.
          </p>
          <ul className="source-list">
            <li>
              <a
                href="https://gist.github.com/jm3/32175bc006a2ce05abd067468e4fa26c"
                target="_blank"
                rel="noreferrer"
              >
                John Manoogian III · dados e desenho do Codex{" "}
                <ExternalLink size={15} />
              </a>
            </li>
            <li>
              <a
                href="https://betterhumans.pub/cognitive-bias-cheat-sheet-55a472476b18"
                target="_blank"
                rel="noreferrer"
              >
                Buster Benson · organização e categorias{" "}
                <ExternalLink size={15} />
              </a>
            </li>
            <li>
              <a
                href="https://commons.wikimedia.org/wiki/File:Cognitive_bias_codex_en.svg"
                target="_blank"
                rel="noreferrer"
              >
                Wikimedia Commons · versão vetorial e referências{" "}
                <ExternalLink size={15} />
              </a>
            </li>
            <li>
              <a href="/fontes.html">
                Bibliografia e notas de interpretação <ArrowUpRight size={15} />
              </a>
            </li>
            <li>
              <a href="/referencia-codex-2016.png" target="_blank">
                Imagem de referência · Codex 2016 <ArrowUpRight size={15} />
              </a>
            </li>
            <li>
              <a href="/inventario.json" target="_blank">
                Inventário completo da imagem em português{" "}
                <ArrowUpRight size={15} />
              </a>
            </li>
          </ul>
          <p>
            A organização e a adaptação educativa são disponibilizadas sob{" "}
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br"
              target="_blank"
              rel="noreferrer"
            >
              CC BY-SA 4.0
            </a>
            . Tradução, textos didáticos, exemplos e exercícios foram
            acrescentados nesta adaptação; não implicam endosso dos autores
            originais.
          </p>
          <h2>Seu ritmo, neste navegador</h2>
          <p>
            O progresso é salvo somente no navegador e neste dispositivo. Não há
            conta, envio das suas respostas ou sincronização. Limpar os dados do
            navegador apaga o progresso. Uma resposta de referência ajuda na
            reflexão; ela não é uma avaliação automática da sua resposta aberta.
          </p>
          <button className="primary-button" onClick={close}>
            Explorar o atlas <ArrowRight size={17} />
          </button>
        </main>
      ) : lesson ? (
        <LessonView
          key={lesson.id}
          lesson={lesson}
          onClose={close}
          onNext={() =>
            open(lessons[(lessons.indexOf(lesson) + 1) % lessons.length].id)
          }
          done={saved.includes(lesson.id)}
          onComplete={() => complete(lesson.id)}
        />
      ) : selected ? (
        <main id="conteudo" className="empty-state">
          <h1>Este caminho não está no atlas.</h1>
          <p>O endereço não corresponde a um viés cadastrado.</p>
          <button onClick={close} className="primary-button">
            Voltar ao atlas
          </button>
        </main>
      ) : (
        <main id="conteudo">
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="edition-line" /> COGNITIVE BIAS CODEX · EM
                PORTUGUÊS
              </div>
              <h1>
                Sua mente toma
                <br />
                atalhos.
                <br />
                <em>Conheça os caminhos.</em>
              </h1>
              <p>
                Um atlas para reconhecer os vieses que moldam suas escolhas.
                Explore, questione e aprenda a pensar com mais clareza.
              </p>
              <div className="hero-actions">
                <a className="primary-button" href="#atlas">
                  Explorar os vieses <ArrowRight size={17} />
                </a>
                <button className="text-button" onClick={random}>
                  <Shuffle size={16} /> Surpreenda-me
                </button>
              </div>
              <div className="hero-facts">
                <span>
                  <strong>188</strong> vieses & efeitos
                </span>
                <span>
                  <strong>04</strong> grandes categorias
                </span>
                <span>
                  <strong>376</strong> questões para praticar
                </span>
              </div>
            </div>
            <Atlas onSelect={open} />
          </section>
          <section
            className="category-section"
            aria-label="Categorias do Codex"
          >
            <div className="section-caption">
              <span>QUATRO DESAFIOS. MUITOS ATALHOS.</span>
              <span>
                Escolha por onde olhar <ArrowUpRight size={14} />
              </span>
            </div>
            <div className="category-grid">
              {categories.map((c, i) => (
                <button
                  key={c.id}
                  className={`category-card ${category === c.id ? "selected" : ""}`}
                  style={
                    {
                      "--category": c.color,
                      "--category-light": c.light,
                    } as CSSProperties
                  }
                  aria-pressed={category === c.id}
                  onClick={() => {
                    changeCategory(category === c.id ? "all" : c.id);
                    document.getElementById("atlas")?.scrollIntoView({
                      behavior: window.matchMedia(
                        "(prefers-reduced-motion: reduce)",
                      ).matches
                        ? "auto"
                        : "smooth",
                      block: "start",
                    });
                  }}
                >
                  <div className="category-top">
                    <span>0{i + 1}</span>
                    <span>
                      {
                        lessons.filter((l) =>
                          l.placements.some((p) => p.category === c.id),
                        ).length
                      }{" "}
                      entradas <ArrowUpRight size={15} />
                    </span>
                  </div>
                  <h2>{c.title}</h2>
                  <p>{c.intro}</p>
                  <div className="category-rule" />
                </button>
              ))}
            </div>
          </section>
          <section className="library" id="atlas">
            <div className="library-heading">
              <div>
                <span className="eyebrow">CURIOSIDADE É UM BOM COMEÇO</span>
                <h2>
                  Explore o seu jeito de pensar<span>.</span>
                </h2>
              </div>
              <div className="view-switch" aria-label="Forma de visualização">
                <button
                  aria-label="Ver cartões"
                  aria-pressed={mode === "cards"}
                  onClick={() => setMode("cards")}
                >
                  <Orbit size={17} />
                  <span>Atlas</span>
                </button>
                <button
                  aria-label="Ver subgrupos da imagem"
                  aria-pressed={mode === "groups"}
                  onClick={() => setMode("groups")}
                >
                  <List size={17} />
                  <span>Subgrupos</span>
                </button>
              </div>
            </div>
            <div className="search-row">
              <div className="search-input">
                <Search size={19} />
                <input
                  ref={searchRef}
                  aria-label="Buscar viés"
                  placeholder="Busque um viés, uma palavra, uma curiosidade…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    aria-label="Limpar busca"
                    onClick={() => {
                      setQuery("");
                      searchRef.current?.focus();
                    }}
                  >
                    <X size={17} />
                  </button>
                )}
              </div>
              <label className="category-select">
                <SlidersHorizontal size={17} />
                <select
                  aria-label="Filtrar categoria"
                  value={category}
                  onChange={(e) => changeCategory(e.target.value)}
                >
                  <option value="all">Todas as categorias</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="filters-row">
              <div className="filter-chips">
                <button
                  aria-pressed={!onlyPending}
                  onClick={() => setOnlyPending(false)}
                >
                  Todos
                </button>
                <button
                  aria-pressed={onlyPending}
                  onClick={() => setOnlyPending(true)}
                >
                  Ainda não explorei
                </button>
                {category !== "all" && (
                  <select
                    aria-label="Filtrar subgrupo"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                  >
                    <option value="all">Todos os subgrupos</option>
                    {categories
                      .find((c) => c.id === category)!
                      .groups.map((g, i) => (
                        <option value={i} key={g}>
                          {g}
                        </option>
                      ))}
                  </select>
                )}
              </div>
              <span role="status">
                {filtered.length}{" "}
                {filtered.length === 1 ? "entrada" : "entradas"}
                {query && ` para “${query}”`}
              </span>
            </div>
            {filtered.length === 0 ? (
              <div className="empty-state">
                <Search size={30} />
                <h3>Nenhum caminho por aqui.</h3>
                <p>Tente outra palavra ou amplie os filtros.</p>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setQuery("");
                    changeCategory("all");
                    setOnlyPending(false);
                  }}
                >
                  Limpar filtros
                </button>
              </div>
            ) : mode === "cards" ? (
              <div className="bias-grid">{filtered.map(card)}</div>
            ) : (
              <div className="grouped-list">
                {categories
                  .filter((c) => category === "all" || c.id === category)
                  .map((c) => (
                    <div key={c.id}>
                      {c.groups.map((g, gi) => {
                        const members = filtered.filter((l) =>
                          l.placements.some(
                            (p) => p.category === c.id && p.group === gi,
                          ),
                        );
                        return members.length > 0 ? (
                          <section key={g} className="subgroup">
                            <span
                              className="eyebrow"
                              style={{ color: c.color }}
                            >
                              {c.title}
                            </span>
                            <h3>
                              {g} <span>({members.length})</span>
                            </h3>
                            <div className="bias-grid">{members.map(card)}</div>
                          </section>
                        ) : null;
                      })}
                    </div>
                  ))}
              </div>
            )}
          </section>
          <section className="closing-note">
            <Mark />
            <p>
              Reconhecer um viés não nos torna imunes a ele.
              <br />
              <em>Mas abre espaço para uma escolha mais consciente.</em>
            </p>
          </section>
        </main>
      )}
      {storageError && (
        <div className="storage-notice" role="status">
          Seu navegador não permitiu salvar o progresso. Ele permanece
          disponível enquanto esta página estiver aberta.
        </div>
      )}
      <footer>
        <a className="footer-brand" href="/">
          entrelinhas
        </a>
        <p>
          Inspirado no Cognitive Bias Codex, de Buster Benson e John Manoogian
          III.
          <br />
          Tradução e adaptação educativa · CC BY-SA 4.0
        </p>
        <button className="text-button" onClick={showAbout}>
          Fontes & projeto <ArrowUpRight size={16} />
        </button>
      </footer>
    </>
  );
}
