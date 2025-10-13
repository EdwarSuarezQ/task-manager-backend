import { z } from "zod";

export const registerSchema = z.object({
  username: z.string({
    required_error: "Se requiere un nombre de usuario",
  }),
  email: z
    .string({
      required_error: "Se requiere un correo electronico",
    })
    .email({
      message: "El correo electronico no es valido",
    }),
  password: z.string({}).min(6, {
    message: "La contraseña debe tener al menos 6 caracteres",
  }),
});

export const loginSchema = z.object({
  email: z
    .string({
      required_error: "Se requiere un correo electronico",
    })
    .email({
      message: "El correo electronico no es valido",
    }),
  password: z
    .string({
      required_error: "Se requiere una contraseña",
    })
    .min(6, {
      message: "La contraseña debe tener al menos 6 caracteres",
    }),
});

export const updateProfileSchema = z.object({
  username: z
    .string({
      required_error: "Se requiere un nombre de usuario",
    })
    .min(3, {
      message: "El nombre de usuario debe tener al menos 3 caracteres",
    })
    .max(20, {
      message: "El nombre de usuario no puede tener más de 20 caracteres",
    }),
  email: z
    .string({
      required_error: "Se requiere un correo electronico",
    })
    .email({
      message: "El correo electronico no es valido",
    }),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string({
      required_error: "Se requiere la contraseña actual",
    }),
    newPassword: z
      .string({
        required_error: "Se requiere una nueva contraseña",
      })
      .min(6, {
        message: "La nueva contraseña debe tener al menos 6 caracteres",
      }),
    confirmPassword: z.string({
      required_error: "Se requiere confirmar la nueva contraseña",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const deleteAccountSchema = z.object({
  password: z.string({
    required_error: "Se requiere la contraseña para eliminar la cuenta",
  }),
  confirmDelete: z
    .boolean({
      required_error: "Debe confirmar la eliminación de la cuenta",
    })
    .refine((val) => val === true, {
      message: "Debe confirmar la eliminación de la cuenta",
    }),
});
