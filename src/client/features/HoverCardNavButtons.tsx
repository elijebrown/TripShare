import { Button, HoverCard, Stack } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useEffect } from 'react'
import { api } from '../api/client'
import { useStore } from '../state/store'

export const HoverCardNavButtons = () => {
    const navigate = useNavigate()

    const trips = useQuery({
        queryKey: ['trips'],
        queryFn: async () => {
            const res = await api.trips.$get()
            if (!res.ok) {
                throw new Error(`Failed to load trips (${res.status})`)
            }
            return res.json()
        },
    })

    const memories = useQuery({
        queryKey: ['memories'],
        queryFn: async () => {
            const res = await api.memories.$get()
            if (!res.ok) {
                throw new Error(`Failed to load memories (${res.status})`)
            }
            return res.json()
        },
    })

    useEffect(() => {
        if (trips.data) {
            useStore.setState({ tripsData: trips.data })
        }
    }, [trips.data])

    useEffect(() => {
        if (memories.data) {
            useStore.setState({ memoriesData: memories.data })
        }
    }, [memories.data])

    return (
        <>
            <HoverCard withArrow>
                <HoverCard.Target>
                    <Button
                        variant="subtle"
                        color="orange"
                        size="md"
                        className="no-click-cursor"
                    >
                        Trips
                    </Button>
                </HoverCard.Target>
                <HoverCard.Dropdown p={0}>
                    <Stack gap={0}>
                        {trips.data?.map((val) => (
                            <Button
                                color="gray"
                                radius={0}
                                variant="subtle"
                                key={val.id}
                                onClick={() => {
                                    navigate(`trips/${val.id}`)
                                }}
                            >
                                {val.tripName}
                            </Button>
                        ))}
                    </Stack>
                </HoverCard.Dropdown>
            </HoverCard>
            <HoverCard withArrow>
                <HoverCard.Target>
                    <Button
                        variant="subtle"
                        color="orange"
                        size="md"
                        className="no-click-cursor"
                    >
                        Memories
                    </Button>
                </HoverCard.Target>
                <HoverCard.Dropdown p={0}>
                    <Stack gap={0}>
                        {memories.data?.map((val) => (
                            <Button
                                color="gray"
                                radius={0}
                                variant="subtle"
                                key={val.id}
                                onClick={() => {
                                    navigate(`memories/${val.id}`)
                                }}
                            >
                                {val.memoryTitle}
                            </Button>
                        ))}
                    </Stack>
                </HoverCard.Dropdown>
            </HoverCard>
        </>
    )
}
