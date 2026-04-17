import { useEffect, useState, useCallback, useRef } from 'react'
import { api } from '../api/client'
import { Layout } from '../components/Layout'
import { useAuth, isAdmin } from '../hooks/useAuth'

interface BrainFile {
  id: string
  folder: string
  filename: string
  title: string
  has_todos: boolean
  updated_at: string
  content?: string
}

interface Folder {
  key: string
  label: string
}

const FOLDER_ICONS: Record<string, string> = {
  '00_Unternehmen': '🏢',
  '01_Kunden':      '👥',
  '02_Sales':       '📈',
  '03_Beratung':    '💬',
  '04_Marketing':   '📣',
  '05_Kreation':    '🎨',
  '06_Fuehrung':    '🎯',
  '07_Finance':     '💶',
  '08_Events':      '📅',
  'assets':         '📁',
}

type PageTab = 'uebersicht' | 'upload'

function MarkdownViewer({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="text-sm text-brand-dark space-y-1 font-mono whitespace-pre-wrap leading-relaxed">
      {lines.map((line, i) => {
        const isTodo = /\[TODO:/i.test(line)
        return (
          <p key={i} className={isTodo ? 'bg-amber-50 text-amber-800 px-1 rounded' : ''}>
            {line || '\u00A0'}
          </p>
        )
      })}
    </div>
  )
}

interface FileDrawerProps {
  file: BrainFile | null
  onClose: () => void
  onUpdated: (f: BrainFile) => void
  onDeleted: (id: string) => void
  isAdmin: boolean
}

function FileDrawer({ file, onClose, onUpdated, onDeleted, isAdmin: adminUser }: FileDrawerProps) {
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (file) {
      setContent(file.content || '')
      setTitle(file.title)
      setEditing(false)
    }
  }, [file])

  if (!file) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await api.put<BrainFile>(`/brain/files/${file.id}`, { title, content })
      onUpdated(updated)
      setEditing(false)
    } catch {
      // keep editing
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`"${file.title}" wirklich löschen?`)) return
    await api.delete(`/brain/files/${file.id}`)
    onDeleted(file.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl">{FOLDER_ICONS[file.folder] || '📄'}</span>
            {editing ? (
              <input
                className="font-serif text-xl text-brand-blue border-b border-brand-blue/30 outline-none bg-transparent w-full"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            ) : (
              <div className="min-w-0">
                <h3 className="font-serif text-xl text-brand-blue truncate">{file.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{file.folder} / {file.filename}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            {adminUser && !editing && (
              <button onClick={() => setEditing(true)}
                className="text-xs text-brand-blue hover:underline font-medium">
                Bearbeiten
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {editing ? (
            <textarea
              className="w-full h-full min-h-96 text-sm font-mono text-brand-dark border border-gray-200
                rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          ) : (
            <MarkdownViewer content={file.content || ''} />
          )}
        </div>

        {adminUser && (
          <div className="px-6 pb-5 pt-3 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
            <button onClick={handleDelete}
              className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">
              Datei löschen
            </button>
            {editing && (
              <div className="flex gap-3">
                <button onClick={() => setEditing(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-brand-dark rounded-lg hover:bg-gray-50">
                  Abbrechen
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="px-5 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium
                    hover:bg-brand-navy transition-colors disabled:opacity-50">
                  {saving ? 'Speichern …' : 'Speichern'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface UploadFormProps {
  folders: Folder[]
  onUploaded: (f: BrainFile) => void
}

function UploadForm({ folders, onUploaded }: UploadFormProps) {
  const [folder, setFolder] = useState('')
  const [title, setTitle] = useState('')
  const [filename, setFilename] = useState('')
  const [content, setContent] = useState('')
  const [mode, setMode] = useState<'text' | 'file'>('file')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const inputClass = `w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
    text-brand-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20`

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const name = file.name.replace(/\.md$/i, '')
    if (!title) setTitle(name.replace(/[-_]/g, ' '))
    if (!filename) setFilename(file.name.endsWith('.md') ? file.name : `${file.name}.md`)
    const reader = new FileReader()
    reader.onload = ev => setContent(ev.target?.result as string || '')
    reader.readAsText(file)
    setMode('file')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!folder || !title || !filename) {
      setError('Abteilung, Titel und Dateiname sind erforderlich')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const created = await api.post<BrainFile>('/brain/files', { folder, title, filename, content })
      onUploaded(created)
      setTitle('')
      setFilename('')
      setContent('')
      if (fileRef.current) fileRef.current.value = ''
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Abteilung *</label>
          <select className={inputClass} value={folder} onChange={e => setFolder(e.target.value)}>
            <option value="">— Abteilung wählen</option>
            {folders.map(f => (
              <option key={f.key} value={f.key}>{FOLDER_ICONS[f.key] || '📁'} {f.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Titel *</label>
          <input className={inputClass} value={title} onChange={e => setTitle(e.target.value)}
            placeholder="z.B. Sales-Prozess" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Dateiname *</label>
        <input className={inputClass} value={filename} onChange={e => setFilename(e.target.value)}
          placeholder="z.B. sales-prozess.md" />
        <p className="text-xs text-gray-400 mt-1">Muss auf .md enden. Existierende Dateien werden überschrieben.</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Inhalt</label>
        <div className="flex gap-3 mb-3">
          <button type="button" onClick={() => setMode('file')}
            className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors
              ${mode === 'file' ? 'bg-brand-blue text-white border-brand-blue' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            Datei hochladen
          </button>
          <button type="button" onClick={() => setMode('text')}
            className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors
              ${mode === 'text' ? 'bg-brand-blue text-white border-brand-blue' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            Direkt eingeben
          </button>
        </div>

        {mode === 'file' ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center
            hover:border-brand-blue/30 transition-colors cursor-pointer"
            onClick={() => fileRef.current?.click()}>
            <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-sm text-gray-500 font-medium">
              {content ? '✓ Datei geladen' : 'Markdown-Datei auswählen'}
            </p>
            <p className="text-xs text-gray-400 mt-1">.md Dateien</p>
            <input ref={fileRef} type="file" accept=".md,text/markdown"
              className="hidden" onChange={handleFileChange} />
          </div>
        ) : (
          <textarea
            className={`${inputClass} resize-none font-mono`} rows={12}
            value={content} onChange={e => setContent(e.target.value)}
            placeholder="# Titel&#10;&#10;Inhalt hier eingeben …" />
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && (
        <p className="text-sm text-green-600 font-medium">Datei erfolgreich gespeichert ✓</p>
      )}

      <button type="submit" disabled={saving}
        className="px-6 py-2.5 rounded-lg bg-brand-blue text-white text-sm font-medium
          hover:bg-brand-navy transition-colors disabled:opacity-50">
        {saving ? 'Speichern …' : 'Datei speichern'}
      </button>
    </form>
  )
}

export function Brain() {
  const { user } = useAuth()
  const admin = isAdmin(user?.role || '')
  const [tab, setTab] = useState<PageTab>('uebersicht')
  const [folders, setFolders] = useState<Folder[]>([])
  const [files, setFiles] = useState<BrainFile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<BrainFile | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [f, bf] = await Promise.all([
      api.get<Folder[]>('/brain/folders'),
      api.get<BrainFile[]>('/brain/files'),
    ])
    setFolders(f)
    setFiles(bf)
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const openFile = async (f: BrainFile) => {
    if (f.content !== undefined) {
      setSelectedFile(f)
      return
    }
    try {
      const full = await api.get<BrainFile>(`/brain/files/${f.id}`)
      setSelectedFile(full)
      setFiles(prev => prev.map(x => x.id === full.id ? full : x))
    } catch {}
  }

  const handleUpdated = (updated: BrainFile) => {
    setFiles(prev => prev.map(f => f.id === updated.id ? { ...f, ...updated } : f))
    setSelectedFile(updated)
  }

  const handleDeleted = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleUploaded = (f: BrainFile) => {
    setFiles(prev => {
      const existing = prev.findIndex(x => x.id === f.id)
      if (existing >= 0) return prev.map(x => x.id === f.id ? f : x)
      return [f, ...prev]
    })
  }

  const foldersWithStats = folders.map(folder => {
    const folderFiles = files.filter(f => f.folder === folder.key)
    const todosCount = folderFiles.filter(f => f.has_todos).length
    return { ...folder, fileCount: folderFiles.length, todosCount, files: folderFiles }
  })

  const displayFolders = selectedFolder
    ? foldersWithStats.filter(f => f.key === selectedFolder)
    : foldersWithStats

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  const totalFiles = files.length
  const totalTodos = files.filter(f => f.has_todos).length

  return (
    <Layout>
      <div className="p-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-3xl font-serif text-brand-blue">Agency Brain</h2>
            <p className="text-sm text-gray-500 mt-1">
              Wissensbasis der Agentur Krüger — {totalFiles} Dateien
              {totalTodos > 0 && (
                <span className="ml-2 text-amber-600 font-medium">{totalTodos} mit offenen TODOs</span>
              )}
            </p>
          </div>
          {admin && (
            <button
              onClick={() => setTab('upload')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-blue text-white
                text-sm font-medium hover:bg-brand-navy transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Datei hochladen
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-gray-100 pb-0">
          {[
            { key: 'uebersicht' as PageTab, label: 'Übersicht' },
            ...(admin ? [{ key: 'upload' as PageTab, label: 'Datei hochladen' }] : []),
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors
                ${tab === t.key
                  ? 'text-brand-blue border-b-2 border-brand-blue bg-brand-blue/5'
                  : 'text-gray-500 hover:text-brand-dark hover:bg-gray-50'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'upload' && admin && (
          <UploadForm folders={folders} onUploaded={f => { handleUploaded(f); setTab('uebersicht') }} />
        )}

        {tab === 'uebersicht' && (
          <>
            {/* Filter by folder */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-colors
                  ${!selectedFolder ? 'bg-brand-blue text-white border-brand-blue' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                Alle Abteilungen
              </button>
              {foldersWithStats.filter(f => f.fileCount > 0).map(f => (
                <button
                  key={f.key}
                  onClick={() => setSelectedFolder(selectedFolder === f.key ? null : f.key)}
                  className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-colors
                    ${selectedFolder === f.key ? 'bg-brand-blue text-white border-brand-blue' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  {FOLDER_ICONS[f.key]} {f.label}
                  {f.todosCount > 0 && (
                    <span className="ml-1.5 bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 text-xs">
                      {f.todosCount} TODO
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Folder grid */}
            {files.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
                <div className="text-4xl mb-4">🧠</div>
                <h3 className="font-serif text-xl text-brand-blue mb-2">Brain noch leer</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Lade die Markdown-Dateien aus dem Agency Brain hoch, um sie hier zu verwalten.
                </p>
                {admin && (
                  <button onClick={() => setTab('upload')}
                    className="px-5 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium
                      hover:bg-brand-navy transition-colors">
                    Erste Datei hochladen
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {displayFolders.filter(f => f.fileCount > 0).map(folder => (
                  <div key={folder.key} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{FOLDER_ICONS[folder.key] || '📁'}</span>
                        <div>
                          <h4 className="font-serif text-base text-brand-blue">{folder.label}</h4>
                          <p className="text-xs text-gray-400">{folder.key}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {folder.todosCount > 0 && (
                          <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50
                            border border-amber-200 rounded-full px-2.5 py-1 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {folder.todosCount} unvollständig
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{folder.fileCount} Datei{folder.fileCount !== 1 ? 'en' : ''}</span>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-50">
                      {folder.files.map(file => (
                        <button
                          key={file.id}
                          onClick={() => openFile(file)}
                          className="w-full flex items-center justify-between px-6 py-3.5
                            hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm text-brand-dark font-medium truncate">{file.title}</span>
                            {file.has_todos && (
                              <span className="flex-shrink-0 text-xs text-amber-600 bg-amber-50 border border-amber-200
                                rounded-full px-2 py-0.5 font-medium">TODO</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                            <span className="text-xs text-gray-400 hidden sm:block">{file.filename}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(file.updated_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: '2-digit' })}
                            </span>
                            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Empty folders hint */}
                {!selectedFolder && foldersWithStats.some(f => f.fileCount === 0) && (
                  <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-5">
                    <p className="text-xs text-gray-400 font-medium mb-2">Abteilungen ohne Dateien:</p>
                    <div className="flex flex-wrap gap-2">
                      {foldersWithStats.filter(f => f.fileCount === 0).map(f => (
                        <span key={f.key} className="text-xs text-gray-400 bg-white border border-gray-200
                          rounded-full px-3 py-1">
                          {FOLDER_ICONS[f.key]} {f.label}
                        </span>
                      ))}
                    </div>
                    {admin && (
                      <button onClick={() => setTab('upload')}
                        className="mt-3 text-xs text-brand-blue hover:underline font-medium">
                        Dateien hochladen →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <FileDrawer
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
        isAdmin={admin}
      />
    </Layout>
  )
}
