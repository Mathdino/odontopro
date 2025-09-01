import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma";
import { Adapter } from "next-auth/adapters";
import GitHub from "next-auth/providers/github";
import { createDefaultCategory } from "@/app/(panel)/dashboard/services/_actions/category-actions";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Verificar se é o primeiro login do usuário
      if (account?.provider && user?.id) {
        try {
          // Verificar se o usuário já tem categorias
          const existingCategories = await prisma.category.findFirst({
            where: { userId: user.id },
          });

          // Se não tem categorias, criar a categoria padrão "Promoções"
          if (!existingCategories) {
            await createDefaultCategory(user.id);
          }
        } catch (error) {
          console.error("Erro ao criar categoria padrão:", error);
          // Não bloquear o login se houver erro na criação da categoria
        }
      }
      return true;
    },
  },
});
