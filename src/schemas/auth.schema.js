import { z } from 'zod';

export const registerSchema = z.object({
    username: z.string( {
        required_error: "Se requiere un nombre de usuario",
    } ),
    email: z.string( {
        required_error: "Se requiere un correo electronico",

    } ).email( {
        message: "El correo electronico no es valido",

    } ),
    password: z.string( {} ).min( 6,{
        message: "La contraseña debe tener al menos 6 caracteres",

    }),

});

export const loginSchema = z.object( {
    email: z.string({
        required_error: "Se requiere un correo electronico",

    }).email( {
        mensage: "El correo electronico no es valido",

    } ),
    password: z.string( {
        required_error: "Se requiere una contraseña",
        
    } ).min( 6, {
        message: "La contraseña debe tener al menos 6 caracteres",
    }),
} );
