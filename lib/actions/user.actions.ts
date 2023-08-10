"use server";

import { revalidatePath } from 'next/cache';
import { connectDatabase } from '../mongoose';

import User from '../models/user.model';

interface UpdateUserParams {
  userId: string;
  username: string;
  name: string;
  image: string;
  bio: string;
  path: string;
}

export async function updateUser({ userId, username, name, image, bio, path }: UpdateUserParams): Promise<void> {
  connectDatabase();
  try {
    await User.findOneAndUpdate({ id: userId }, {
      username: username.toLowerCase(),
      name,
      image,
      bio,
      onboarded: true
    }, { upsert: true });
    if (path === "/profile/edit") {
      revalidatePath(path);
    }
  } catch (error: any) {
    console.error("Failed to create/update user", error.message);
  }
}

export async function fetchUser(userId: string): Promise<void> {
  connectDatabase();
  try {
    const user = await User.findOne({ id: userId });
    return user;
  } catch (error: any) {
    console.error("Failed to get user info", error.message);
  }
}