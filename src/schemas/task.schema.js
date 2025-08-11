import { z } from 'zod';

export const createTaskSchame = z.object({
    title: z.string( {
        required_error: "title is required."
    } ),
    description: z.string( {
        required_error: "description muts be a string."
    } ),
    date: z.string( {} ).datetime().optional(),
});