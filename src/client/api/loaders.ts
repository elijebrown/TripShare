import type { LoaderFunctionArgs } from 'react-router'
import { api } from './client'

export const tripPhotosLoader = async ({ params }: LoaderFunctionArgs) => {
    const res = await api.tripPhotos.$get({
        query: { tripId: params.tripId ?? '' },
    })
    return res.json()
}

export const photosLoader = async () => {
    const res = await api.photos.$get()
    return res.json()
}
