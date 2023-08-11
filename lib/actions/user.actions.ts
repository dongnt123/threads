"use server";

import { revalidatePath } from 'next/cache';
import { FilterQuery, SortOrder } from 'mongoose';

import { connectDatabase } from '../mongoose';
import User from '../models/user.model';
import Thread from '../models/thread.model';

interface UpdateUserParams {
  userId: string;
  username: string;
  name: string;
  image: string;
  bio: string;
  path: string;
}

interface FetchUsersParams {
  userId: string;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}

export async function updateUser({ userId, username, name, image, bio, path }: UpdateUserParams) {
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

export async function fetchUser(userId: string) {
  connectDatabase();
  try {
    const user = await User.findOne({ id: userId });
    return user;
  } catch (error: any) {
    console.error("Failed to get user info", error.message);
  }
}

export async function fetchUserPosts(userId: string) {
  connectDatabase();
  try {
    const threads = await User.findOne({ id: userId })
      .populate({
        path: "threads",
        model: Thread,
        populate: {
          path: "children",
          model: Thread,
          populate: {
            path: "author",
            model: User,
            select: "id name image"
          }
        }
      });
    return threads;
  } catch (error: any) {
    console.error("Failed to fetch user posts info", error.message);
  }
}

export async function fetchUsers({ userId, searchString = "", pageNumber = 1, pageSize = 20, sortBy = "desc" }: FetchUsersParams) {
  connectDatabase();
  try {
    const skipAmount = (pageNumber - 1) * pageSize;
    const regex = new RegExp(searchString, "i");
    const query: FilterQuery<typeof User> = {
      id: { $ne: userId }
    };
    if (searchString.trim() !== "") {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } }
      ]
    };
    const sortOptions = { createdAt: sortBy };
    const userQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);
    const totalUserCount = await User.countDocuments(query);
    const users = await userQuery.exec();
    const isNext = totalUserCount > skipAmount + users.length;
    return { users, isNext };
  } catch (error: any) {
    console.error("Failed to fetch users info", error.message);
  }
}

export async function getActivity(userId: string) {
  connectDatabase();
  try {
    const userThreads = await Thread.find({ author: userId });
    const childThreadIds = userThreads.reduce((acc, userThread) => {
      return acc.concat(userThread.children);
    }, []);
    const replies = await Thread.find({
      _id: { $in: childThreadIds },
      author: { $ne: userId }
    }).populate({
      path: "author",
      model: User,
      select: "name image _id"
    });
    return replies;
  } catch (error: any) {
    console.error("Failed to fetch user activity", error.message);
  }
}