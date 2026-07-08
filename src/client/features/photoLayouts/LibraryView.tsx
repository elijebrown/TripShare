import { Flex } from '@mantine/core'
import type { Photo } from '../../../shared/types'
import { Cloudinary } from '@cloudinary/url-gen/index'
import { fill } from '@cloudinary/url-gen/actions/resize'
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity'

type props = { photos: Photo[] }
export const LibraryView = ({ photos }: props) => {
    const cloudinary = new Cloudinary({
        cloud: {
            cloudName: 'dchwbmloi',
        },
    })

    return (
        <Flex justify="center" display="flex" wrap="wrap" p="12px">
            {photos.map((value) => {
                const cldImg = cloudinary
                    .image(value.photoFilepath)
                    .format('auto')
                    .quality('auto')
                    .resize(
                        fill().width(320).height(320).gravity(autoGravity())
                    )
                    .toURL()

                return (
                    <img
                        key={value.photoFilepath}
                        src={cldImg}
                        style={{
                            maxHeight: '160px',
                            maxWidth: '160px',
                            border: '2px solid black',
                        }}
                    />
                )
            })}
        </Flex>
    )
}
