import { useLoaderData } from 'react-router'
import { LibraryView } from '../features/photoLayouts/LibraryView'
import { photosLoader } from '../api/loaders'

export const Photos = () => {
    const photos = useLoaderData<typeof photosLoader>()

    return <LibraryView photos={photos ?? []} />
}
