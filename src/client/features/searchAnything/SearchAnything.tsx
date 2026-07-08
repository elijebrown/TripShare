import { Autocomplete, MantineSize } from '@mantine/core'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../../api/client'

type props = {
    size?: MantineSize
}

export const SearchAnything = ({ size }: props) => {
    const [results, setResults] = useState<string[]>([])
    const latestQuery = useRef('')

    const handleChange = async (value: string) => {
        latestQuery.current = value
        if (!value) {
            setResults([])
            return
        }
        const res = await api.searchAll.$get({ query: { search: value } })
        if (!res.ok) {
            return
        }
        const searchResults = await res.json()
        if (latestQuery.current !== value) {
            return
        }
        setResults(
            searchResults.map(
                (searchObj) =>
                    `${searchObj.name}: ${searchObj.type === 'province' ? 'region' : searchObj.type}`
            )
        )
    }

    const navigate = useNavigate()

    return (
        <Autocomplete
            size={size || 'sm'}
            data={results}
            placeholder="Search Anything.."
            onChange={handleChange}
            onOptionSubmit={() => {
                navigate('/')
            }}
        />
    )
}
