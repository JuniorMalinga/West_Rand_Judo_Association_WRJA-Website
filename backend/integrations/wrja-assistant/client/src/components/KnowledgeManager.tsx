import { useMemo, useRef, useState } from 'react';
import { BookOpen, Download, FileJson2, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import type { KnowledgeBase, KnowledgeEntry } from '../../../server/services/types';
import { createBlankEntry, exportKnowledgeBase, parseKnowledgeJson, starterKnowledgeBase } from '../lib/knowledge';

interface Props {
  knowledgeBase: KnowledgeBase;
  onChange: (next: KnowledgeBase) => void;
}

function saveDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function listField(value: string[]): string {
  return value.join(', ');
}

function parseListField(value: string): string[] {
  return value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean).slice(0, 30);
}

interface EditorProps {
  entry: KnowledgeEntry;
  isNew: boolean;
  onClose: () => void;
  onSave: (entry: KnowledgeEntry) => void;
}

function EntryEditor({ entry, isNew, onClose, onSave }: EditorProps) {
  const [draft, setDraft] = useState({
    ...entry,
    keywordsText: listField(entry.keywords),
    relatedText: listField(entry.relatedTerms),
    questionsText: listField(entry.questions),
  });
  const [error, setError] = useState('');

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.answer.trim()) {
      setError('Add a title and answer before saving.');
      return;
    }
    onSave({
      id: draft.id,
      title: draft.title.trim(),
      category: draft.category.trim() || 'Uncategorized',
      keywords: parseListField(draft.keywordsText),
      relatedTerms: parseListField(draft.relatedText),
      questions: parseListField(draft.questionsText),
      answer: draft.answer.trim(),
      source: draft.source?.trim() || undefined,
      notes: draft.notes?.trim() || undefined,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="entry-editor" role="dialog" aria-modal="true" aria-labelledby="entry-editor-title">
        <div className="editor-heading">
          <div>
            <p className="eyebrow">Knowledge entry</p>
            <h2 id="entry-editor-title">{isNew ? 'Add an entry' : 'Edit entry'}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close editor"><X size={18} /></button>
        </div>
        <form onSubmit={handleSave} className="editor-form">
          <label>Title<input maxLength={160} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} autoFocus /></label>
          <label>Category<input maxLength={120} value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="General" /></label>
          <label>Answer<textarea rows={7} maxLength={8000} value={draft.answer} onChange={(event) => setDraft({ ...draft, answer: event.target.value })} placeholder="Write the verified information the assistant should use." /></label>
          <label>Keywords <span className="field-hint">Separate with commas</span><input value={draft.keywordsText} onChange={(event) => setDraft({ ...draft, keywordsText: event.target.value })} placeholder="topic, feature, phrase" /></label>
          <label>Related terms and synonyms <span className="field-hint">Separate with commas</span><input value={draft.relatedText} onChange={(event) => setDraft({ ...draft, relatedText: event.target.value })} placeholder="alternate wording, common phrase" /></label>
          <label>Example questions <span className="field-hint">Separate with commas</span><textarea rows={2} value={draft.questionsText} onChange={(event) => setDraft({ ...draft, questionsText: event.target.value })} placeholder="How does this work?, Can I use it for…?" /></label>
          <label>Source or reference<input maxLength={240} value={draft.source || ''} onChange={(event) => setDraft({ ...draft, source: event.target.value })} placeholder="Document, URL, or internal reference" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="editor-actions">
            <button className="button-secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="button-primary" type="submit">Save entry</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function KnowledgeManager({ knowledgeBase, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState<{ text: string; kind: 'success' | 'error' } | null>(null);
  const [editing, setEditing] = useState<KnowledgeEntry | null>(null);
  const [isNew, setIsNew] = useState(false);

  const entries = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return knowledgeBase.entries;
    return knowledgeBase.entries.filter((entry) => [
      entry.title, entry.category, entry.answer, entry.source || '',
      ...entry.keywords, ...entry.relatedTerms, ...entry.questions,
    ].join(' ').toLowerCase().includes(clean));
  }, [knowledgeBase.entries, query]);

  async function importFile(file?: File) {
    if (!file) return;
    try {
      const parsed = parseKnowledgeJson(await file.text());
      onChange(parsed);
      setNotice({ text: `Imported ${parsed.entries.length} entries. This replaces the current library; export first if you need a backup.`, kind: 'success' });
      if (inputRef.current) inputRef.current.value = '';
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : 'Could not read this JSON file.', kind: 'error' });
    }
  }

  function saveEntry(entry: KnowledgeEntry) {
    const exists = knowledgeBase.entries.some((item) => item.id === entry.id);
    const entriesNext = exists
      ? knowledgeBase.entries.map((item) => item.id === entry.id ? entry : item)
      : [entry, ...knowledgeBase.entries];
    onChange({ version: 1, entries: entriesNext });
    setEditing(null);
    setIsNew(false);
    setNotice({ text: exists ? 'Entry updated.' : 'Entry added.', kind: 'success' });
  }

  function deleteEntry(entry: KnowledgeEntry) {
    onChange({ version: 1, entries: knowledgeBase.entries.filter((item) => item.id !== entry.id) });
    setNotice({ text: `Deleted “${entry.title}”.`, kind: 'success' });
  }

  function restoreSample() {
    onChange(starterKnowledgeBase());
    setNotice({ text: 'Sample knowledge restored.', kind: 'success' });
  }

  return (
    <section className="knowledge-page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Your reference library</p>
          <h1>Knowledge base</h1>
          <p className="page-description">Add the material you want Askwise to rely on. Local answers cite entries from this library first.</p>
        </div>
        <button className="button-primary" type="button" onClick={() => { setEditing(createBlankEntry()); setIsNew(true); }}><Plus size={16} /> Add entry</button>
      </div>

      <div className="storage-notice">
        <span className="notice-mark"><BookOpen size={17} /></span>
        <div><strong>Saved in this browser</strong><p>Your imported knowledge stays in this browser profile. Export JSON to back it up or move it to another device.</p></div>
      </div>

      <div className="library-toolbar">
        <div className="library-count"><FileJson2 size={17} /><strong>{knowledgeBase.entries.length}</strong><span>{knowledgeBase.entries.length === 1 ? 'entry' : 'entries'}</span></div>
        <div className="library-actions">
          <input ref={inputRef} type="file" accept="application/json,.json" className="visually-hidden" aria-label="Choose a JSON knowledge-base file" onChange={(event) => void importFile(event.target.files?.[0])} />
          <button className="button-secondary" type="button" onClick={() => inputRef.current?.click()}><Upload size={15} /> Import JSON</button>
          <button className="button-secondary" type="button" onClick={() => saveDownload('askwise-knowledge-base.json', exportKnowledgeBase(knowledgeBase))}><Download size={15} /> Export JSON</button>
          <button className="button-quiet" type="button" onClick={restoreSample}>Restore sample</button>
        </div>
      </div>

      {notice && <div className={`inline-notice ${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.text}<button className="notice-dismiss" type="button" aria-label="Dismiss notification" onClick={() => setNotice(null)}><X size={14} /></button></div>}

      <div className="library-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find an entry, topic, or phrase…" aria-label="Search knowledge entries" /></div>

      <div className="entry-list">
        {entries.length === 0 ? <div className="empty-library"><BookOpen size={23} /><h2>No entries match</h2><p>Try another search or add a new knowledge entry.</p></div> : entries.map((entry) => (
          <article className="entry-card" key={entry.id}>
            <div className="entry-card-main">
              <div className="entry-meta"><span>{entry.category}</span>{entry.source && <><span className="meta-divider">·</span><span>{entry.source}</span></>}</div>
              <h2>{entry.title}</h2>
              <p className="entry-answer">{entry.answer}</p>
              <div className="entry-tags">{entry.keywords.slice(0, 4).map((keyword) => <span key={keyword}>{keyword}</span>)}</div>
            </div>
            <div className="entry-actions">
              <button className="button-quiet" type="button" onClick={() => { setEditing(entry); setIsNew(false); }}>Edit</button>
              <button className="icon-button danger" type="button" onClick={() => deleteEntry(entry)} aria-label={`Delete ${entry.title}`}><Trash2 size={15} /></button>
            </div>
          </article>
        ))}
      </div>

      <p className="library-footnote">JSON format: a list of entries or an object containing <code>entries</code>. Each entry requires a <code>title</code> and <code>answer</code>; categories, keywords, related terms, example questions, and source references improve retrieval.</p>

      {editing && <EntryEditor entry={editing} isNew={isNew} onClose={() => { setEditing(null); setIsNew(false); }} onSave={saveEntry} />}
    </section>
  );
}
