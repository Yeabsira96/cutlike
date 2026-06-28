'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

// shape of a single uploaded clip
export interface Clip {
  id: string
  file: File
  filename: string
  sizeBytes: number
  status: 'pending' | 'analyzing' | 'ready' | 'error'
  metadata?: {
    duration: number
    width: number
    height: number
    fps: number
    codec: string
  }
  fingerprint?: {
    estimatedCutsPerMinute: number
    avgShotLength: number
    resolution: string
    energyLevel: string
    editingStyle: string
  }
}

// shape of a single inspiration link
export interface Inspo {
  id: string
  url: string
  weight: number
  platform: 'youtube' | 'tiktok' | 'other'
  status: 'pending' | 'analyzing' | 'ready' | 'error'
  title?: string
  fingerprint?: {
    estimatedCutsPerMinute: number
    avgShotLength: number
    energyLevel: string
    editingStyle: string
  }
}

// shape of a single timeline clip in the generated edit
export interface TimelineClip {
  clipId: string
  filename: string
  startTime: number
  endTime: number
  transition: 'cut' | 'crossfade' | 'dissolve'
}

// shape of a chat message
export interface Message {
  role: 'user' | 'ai'
  text: string
  timestamp: Date
}

// the full editor state
export interface EditorState {
  clips: Clip[]
  inspirations: Inspo[]
  timeline: TimelineClip[]
  messages: Message[]
  isGenerating: boolean
  isAnalyzingInspo: boolean
  projectName: string
}

// all the actions you can do
interface EditorContextType {
  state: EditorState
  addClips: (files: File[]) => void
  removeClip: (id: string) => void
  updateClip: (id: string, updates: Partial<Clip>) => void
  addInspo: (url: string, weight: number) => void
  removeInspo: (id: string) => void
  updateInspo: (id: string, updates: Partial<Inspo>) => void
  setTimeline: (timeline: TimelineClip[]) => void
  addMessage: (message: Message) => void
  setIsGenerating: (val: boolean) => void
  setIsAnalyzingInspo: (val: boolean) => void
  setProjectName: (name: string) => void
}

const EditorContext = createContext<EditorContextType | null>(null)

// helper to generate unique ids
function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EditorState>({
    clips: [],
    inspirations: [],
    timeline: [],
    messages: [
      {
        role: 'ai',
        text: 'Upload your footage and add inspiration links to get started. I\'ll analyze the style and generate a first cut.',
        timestamp: new Date(),
      }
    ],
    isGenerating: false,
    isAnalyzingInspo: false,
    projectName: 'Untitled project',
  })

  function addClips(files: File[]) {
    const newClips: Clip[] = files.map(file => ({
      id: generateId(),
      file,
      filename: file.name,
      sizeBytes: file.size,
      status: 'pending',
    }))
    setState(prev => ({ ...prev, clips: [...prev.clips, ...newClips] }))
  }

  function removeClip(id: string) {
    setState(prev => ({ ...prev, clips: prev.clips.filter(c => c.id !== id) }))
  }

  function updateClip(id: string, updates: Partial<Clip>) {
    setState(prev => ({
      ...prev,
      clips: prev.clips.map(c => c.id === id ? { ...c, ...updates } : c)
    }))
  }

  function addInspo(url: string, weight: number) {
    const platform = url.includes('youtube.com') || url.includes('youtu.be')
      ? 'youtube'
      : url.includes('tiktok.com')
      ? 'tiktok'
      : 'other'

    const newInspo: Inspo = {
      id: generateId(),
      url,
      weight,
      platform,
      status: 'pending',
    }
    setState(prev => ({ ...prev, inspirations: [...prev.inspirations, newInspo] }))
  }

  function removeInspo(id: string) {
    setState(prev => ({
      ...prev,
      inspirations: prev.inspirations.filter(i => i.id !== id)
    }))
  }

  function updateInspo(id: string, updates: Partial<Inspo>) {
    setState(prev => ({
      ...prev,
      inspirations: prev.inspirations.map(i => i.id === id ? { ...i, ...updates } : i)
    }))
  }

  function setTimeline(timeline: TimelineClip[]) {
    setState(prev => ({ ...prev, timeline }))
  }

  function addMessage(message: Message) {
    setState(prev => ({ ...prev, messages: [...prev.messages, message] }))
  }

  function setIsGenerating(val: boolean) {
    setState(prev => ({ ...prev, isGenerating: val }))
  }

  function setIsAnalyzingInspo(val: boolean) {
    setState(prev => ({ ...prev, isAnalyzingInspo: val }))
  }

  function setProjectName(name: string) {
    setState(prev => ({ ...prev, projectName: name }))
  }

  return (
    <EditorContext.Provider value={{
      state,
      addClips,
      removeClip,
      updateClip,
      addInspo,
      removeInspo,
      updateInspo,
      setTimeline,
      addMessage,
      setIsGenerating,
      setIsAnalyzingInspo,
      setProjectName,
    }}>
      {children}
    </EditorContext.Provider>
  )
}

// custom hook — components call useEditor() to get state and actions
export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used inside EditorProvider')
  return ctx
}