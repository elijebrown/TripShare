import { useStore } from './store'

export const useView = () => useStore((state) => state.view)
export const useQuality = () => useStore((state) => state.quality)
export const useTripsData = () => useStore((state) => state.tripsData)
export const useMemoriesData = () => useStore((state) => state.memoriesData)
export const useStoreActions = () => useStore((state) => state.storeActions)