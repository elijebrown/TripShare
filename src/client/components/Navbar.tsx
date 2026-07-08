import { Button, Grid } from '@mantine/core'
import { defSpacing } from '../constants'
import { HoverCardNavButtons } from '../features/HoverCardNavButtons'
import { useNavigate } from 'react-router'
import { SearchAnything } from '../features/searchAnything/SearchAnything'

export const Navbar = () => {
    const navigate = useNavigate()

    return (
        <Grid mt={defSpacing} ml={defSpacing} mr={defSpacing} pos={'sticky'}>
            <Grid.Col span={8}>
                <Button
                    onClick={() => {
                        navigate('/')
                    }}
                    variant="subtle"
                    color="orange"
                    size="md"
                >
                    Home
                </Button>
                <HoverCardNavButtons />
                <Button
                    variant="subtle"
                    color="orange"
                    size="md"
                    onClick={() => {
                        navigate('/photos')
                    }}
                >
                    Photos
                </Button>
                <Button variant="subtle" color="orange" size="md">
                    About
                </Button>
            </Grid.Col>
            <Grid.Col span={4}>
                <SearchAnything />
            </Grid.Col>
        </Grid>
    )
}
