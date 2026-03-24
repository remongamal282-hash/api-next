import { z } from "zod";

const imageMimes = ["image/jpg", "image/jpeg", "image/png", "image/webp"] as const;
const maxImageSize = 2 * 1024 * 1024;

const numberSchema = z.preprocess((value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return value;
}, z.number({ invalid_type_error: "The price field must be numeric." }));

const requiredImageSchema = z
  .custom<File>((value) => value instanceof File, { message: "The image field is required." })
  .refine((file) => file.size > 0, { message: "The image field is required." })
  .refine((file) => imageMimes.includes(file.type as (typeof imageMimes)[number]), {
    message: "The image must be a file of type: jpg, jpeg, png, webp."
  })
  .refine((file) => file.size <= maxImageSize, {
    message: "The image may not be greater than 2048 kilobytes."
  });

const optionalImageSchema = z
  .custom<File | undefined>((value) => value === undefined || value instanceof File)
  .refine((file) => file === undefined || imageMimes.includes(file.type as (typeof imageMimes)[number]), {
    message: "The image must be a file of type: jpg, jpeg, png, webp."
  })
  .refine((file) => file === undefined || file.size <= maxImageSize, {
    message: "The image may not be greater than 2048 kilobytes."
  });

export const storeProdectSchema = z.object({
  name: z.string().trim().min(1, "The name field is required.").max(255),
  descripshin: z.string().trim().min(1, "The descripshin field is required."),
  price: numberSchema,
  image: requiredImageSchema
});

export const updateProdectWebSchema = z.object({
  name: z.string().trim().min(1, "The name field is required.").max(255),
  descripshin: z.string().trim().min(1, "The descripshin field is required."),
  price: numberSchema,
  image: optionalImageSchema.optional()
});

export const updateProdectApiSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    descripshin: z.string().trim().min(1).optional(),
    price: numberSchema.optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided."
  });

export function parseStoreProdectFormData(formData: FormData) {
  return storeProdectSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    descripshin: String(formData.get("descripshin") ?? ""),
    price: formData.get("price"),
    image: formData.get("image")
  });
}

export function parseUpdateProdectWebFormData(formData: FormData) {
  const imageField = formData.get("image");
  const image = imageField instanceof File && imageField.size > 0 ? imageField : undefined;

  return updateProdectWebSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    descripshin: String(formData.get("descripshin") ?? ""),
    price: formData.get("price"),
    image
  });
}

export function formatValidationErrors(error: z.ZodError) {
  return error.flatten().fieldErrors;
}
