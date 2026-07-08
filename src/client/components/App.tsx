import '../styles/App.css'
import '@mantine/core/styles.css'
import '@mantine/carousel/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MantineProvider } from '@mantine/core'
import { Navbar } from './Navbar'
import { Outlet } from 'react-router'

const queryClient = new QueryClient()

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <MantineProvider defaultColorScheme="dark">
                <Navbar />
                <Outlet />
            </MantineProvider>
        </QueryClientProvider>
    )
}

export default App
