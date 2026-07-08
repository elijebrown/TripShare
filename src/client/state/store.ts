import { create } from 'zustand'
import type { Memory, Trip } from '../../shared/types'

type viewType = 'carousel' | 'quad' | 'compact' | 'library'
type imageQuality = 'best' | 'high' | 'low'
type storeState = {
    view: viewType
    quality: imageQuality
    tripsData: Trip[]
    memoriesData: Memory[]
}

type storeAction = {
    storeActions: {
        setView: (view: viewType) => void
    }
}

type storeType = storeState & storeAction

export const useStore = create<storeType>()((set) => ({
    view: 'carousel',
    quality: 'high',
    tripsData: [],
    memoriesData: [],
    storeActions: {
        setView: (view) => set({ view }),
    },
}))
