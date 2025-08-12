"use server"

import prisma from "@/lib/prisma"


interface GetUserDataProps{
  userId : string;
}

export async function getUserData({ userId }: GetUserDataProps) {
  try{
    //VERIFICAÇÃO DE ID
    if(!userId){
      return null;
    }
    
     const user = await prisma.user.findFirst({
    where: {
      id: userId
    },
    include:{
      subscription: true,
    }
  })

  //VERIFICAÇÃO DE USUÁRIO
  if(!user){
    return null;
  }

  return user;

  }catch(err){
    console.log(err);
    return null;
  }



}