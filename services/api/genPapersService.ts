import AsyncStorage from "@react-native-async-storage/async-storage";

// Gen. Papers (plataforma de posters, Firebase "gen-papers"). La lectura de eventos, campos
// y papers es pública, así que se hace por la API REST de Firestore; el voto pasa por la
// Cloud Function castVote, que guarda votes/{cédula} por evento (1 voto por cédula por evento).
const PROJECT_ID = "gen-papers";
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const FUNCTIONS_URL = `https://us-central1-${PROJECT_ID}.cloudfunctions.net`;

export interface GenPapersSection {
  slug: string;
  label: string;
}

// Eventos de la app (Mongo _id) cuyos posters viven en Gen. Papers, uno por especialidad.
const GEN_PAPERS_EVENTS: Record<string, GenPapersSection[]> = {
  // VII Congreso Nacional de Investigación de Hematología y Oncología
  "6ac67fb2f7468d0a549c7769": [
    { slug: "congreso-nacional-acho-2026-oncologia", label: "Oncología" },
    { slug: "congreso-nacional-acho-2026-hematologia", label: "Hematología" },
  ],
};

export const getGenPapersSections = (
  eventId: string | string[] | undefined
): GenPapersSection[] | null => {
  const id = Array.isArray(eventId) ? eventId[0] : eventId;
  return (id && GEN_PAPERS_EVENTS[id]) || null;
};

export type GenPapersVotingStatus = "upcoming" | "open" | "closed";

export interface GenPapersEvent {
  name: string;
  votingOpen: boolean;
  votingStatus: GenPapersVotingStatus;
}

export interface GenPaperField {
  id: string;
  label: string;
  type: string;
  order: number;
  options: { id: string; name: string }[];
}

export interface GenPaper {
  id: string;
  title: string;
  authors: string[];
  institution: string;
  urlPdf: string;
  attributes: Record<string, any>;
  voteCount: number;
}

// Convierte un Value de la API REST de Firestore a un valor JS plano.
const fromValue = (v: any): any => {
  if (!v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromValue);
  if ("mapValue" in v) return fromFields(v.mapValue.fields);
  return null;
};

const fromFields = (fields: Record<string, any> = {}): Record<string, any> =>
  Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, fromValue(value)])
  );

const docId = (name: string) => name.split("/").pop() as string;

const getDocument = async (path: string): Promise<Record<string, any> | null> => {
  const response = await fetch(`${FIRESTORE_URL}/${path}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Gen. Papers respondió ${response.status}`);
  const json = await response.json();
  return { id: docId(json.name), ...fromFields(json.fields) };
};

const listDocuments = async (path: string): Promise<Record<string, any>[]> => {
  const docs: Record<string, any>[] = [];
  let pageToken = "";
  do {
    const query = `pageSize=300${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const response = await fetch(`${FIRESTORE_URL}/${path}?${query}`);
    if (!response.ok) throw new Error(`Gen. Papers respondió ${response.status}`);
    const json = await response.json();
    (json.documents || []).forEach((d: any) =>
      docs.push({ id: docId(d.name), ...fromFields(d.fields) })
    );
    pageToken = json.nextPageToken || "";
  } while (pageToken);
  return docs;
};

const toPaper = (doc: Record<string, any>): GenPaper => ({
  id: doc.id,
  title: doc.title ?? "",
  authors: Array.isArray(doc.authors) ? doc.authors : [],
  institution: doc.institution ?? "",
  urlPdf: doc.urlPdf ?? "",
  attributes: doc.attributes ?? {},
  voteCount: typeof doc.voteCount === "number" ? doc.voteCount : 0,
});

export const fetchGenPapersEvent = async (
  slug: string
): Promise<GenPapersEvent | null> => {
  const doc = await getDocument(`events/${slug}`);
  if (!doc) return null;
  const votingStatus = getVotingStatus(doc);
  return { name: doc.name ?? "", votingOpen: votingStatus === "open", votingStatus };
};

// Además del flag votingOpen, la votación solo está abierta dentro de la ventana
// votingOpensAt–votingClosesAt del evento (si están definidas).
const getVotingStatus = (doc: Record<string, any>): GenPapersVotingStatus => {
  const now = Date.now();
  const closesAt = doc.votingClosesAt ? Date.parse(doc.votingClosesAt) : NaN;
  if (!isNaN(closesAt) && now >= closesAt) return "closed";
  const opensAt = doc.votingOpensAt ? Date.parse(doc.votingOpensAt) : NaN;
  if (doc.votingOpen !== true || (!isNaN(opensAt) && now < opensAt)) return "upcoming";
  return "open";
};

export const fetchGenPaperFields = async (slug: string): Promise<GenPaperField[]> => {
  const docs = await listDocuments(`events/${slug}/fields`);
  return docs
    .map((d) => ({
      id: d.id,
      label: d.label ?? "",
      type: d.type ?? "text",
      order: typeof d.order === "number" ? d.order : 0,
      options: Array.isArray(d.options)
        ? d.options.map((o: any) => ({ id: o.id, name: o.name }))
        : [],
    }))
    .sort((a, b) => a.order - b.order);
};

// Mismo orden que la web: alfabético por título.
export const fetchGenPapers = async (slug: string): Promise<GenPaper[]> => {
  const docs = await listDocuments(`events/${slug}/papers`);
  return docs
    .map(toPaper)
    .sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }));
};

export const fetchGenPaperById = async (
  slug: string,
  paperId: string
): Promise<GenPaper | null> => {
  const doc = await getDocument(`events/${slug}/papers/${paperId}`);
  return doc ? toPaper(doc) : null;
};

// Texto legible de un atributo (las listas guardan ids de opción).
export const formatPaperAttribute = (field: GenPaperField, value: any): string => {
  if (value === null || value === undefined || value === "") return "";
  const optionName = (id: string) =>
    field.options.find((o) => o.id === id)?.name ?? id;
  if (field.type === "select") return optionName(value);
  if (field.type === "multiselect" && Array.isArray(value))
    return value.map(optionName).join(", ");
  return String(value);
};

export type GenPapersVoteErrorCode =
  | "already-exists"
  | "not-found"
  | "failed-precondition"
  | "unknown";

export class GenPapersVoteError extends Error {
  constructor(
    public code: GenPapersVoteErrorCode,
    message: string,
    public paperTitle?: string
  ) {
    super(message);
  }
}

const ERROR_CODES: Record<string, GenPapersVoteErrorCode> = {
  ALREADY_EXISTS: "already-exists",
  NOT_FOUND: "not-found",
  FAILED_PRECONDITION: "failed-precondition",
};

// Llama la callable castVote por HTTP (protocolo de callables: { data } → { result } | { error }).
export const castGenPaperVote = async (
  slug: string,
  idNumber: string,
  paperId: string
): Promise<void> => {
  let json: any = null;
  try {
    const response = await fetch(`${FUNCTIONS_URL}/castVote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: { eventSlug: slug, idNumber, paperId } }),
    });
    json = await response.json();
  } catch {
    throw new GenPapersVoteError(
      "unknown",
      "No se pudo registrar tu voto. Revisa tu conexión e inténtalo de nuevo."
    );
  }
  if (json?.error) {
    throw new GenPapersVoteError(
      ERROR_CODES[json.error.status] ?? "unknown",
      json.error.message || "No se pudo registrar tu voto.",
      json.error.details?.paperTitle
    );
  }
};

// Los votos no son legibles desde el cliente, así que el voto de cada cédula por evento se
// recuerda localmente (al votar o cuando castVote responde already-exists).
export interface StoredGenPaperVote {
  paperId?: string;
  paperTitle: string;
}

const voteKey = (slug: string, idNumber: string) =>
  `genpapers_vote_${slug}_${idNumber}`;

export const getStoredGenPaperVote = async (
  slug: string,
  idNumber: string
): Promise<StoredGenPaperVote | null> => {
  try {
    const raw = await AsyncStorage.getItem(voteKey(slug, idNumber));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const storeGenPaperVote = async (
  slug: string,
  idNumber: string,
  vote: StoredGenPaperVote
): Promise<void> => {
  try {
    await AsyncStorage.setItem(voteKey(slug, idNumber), JSON.stringify(vote));
  } catch {
    // Solo es un recordatorio local; el límite real lo aplica castVote.
  }
};
