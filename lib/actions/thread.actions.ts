"use server";

import { revalidatePath } from 'next/cache';
import { connectDatabase } from '../mongoose';

import Thread from '../models/thread.model';
import User from '../models/user.model';

interface CreateThreadParams {
  text: string;
  author: string;
  communityId: string | null;
  path: string
}

interface AddCommentToThreadParams {
  threadId: string;
  commentText: string;
  userId: string;
  path: string
}

export async function createThread({ text, author, communityId, path }: CreateThreadParams): Promise<void> {
  connectDatabase();
  try {
    const thread = await Thread.create({
      text,
      author,
      communityId: null
    });
    await User.findByIdAndUpdate(author, {
      $push: {
        thread: thread._id
      }
    });
    revalidatePath(path);
  } catch (error: any) {
    console.error("Failed to get user info", error.message);
  }
}

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
  connectDatabase();
  try {
    const skipAmount = (pageNumber - 1) * pageSize;
    const postsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(pageSize)
      .populate({ path: "author", model: User })
      .populate({
        path: "children",
        populate: {
          path: "author",
          model: User,
          select: "_id name parentId image"
        }
      });
    const totalPostsCount = await Thread.countDocuments({ parentId: { $in: [null, undefined] } })
    const posts = await postsQuery.exec();
    const isNext = totalPostsCount > skipAmount + posts.length;
    return { posts, isNext };
  } catch (error: any) {
    console.error("Failed to fetch posts", error.message);
  }
}

export async function fetchThreadById(threadId: string) {
  connectDatabase();
  try {
    const thread = await Thread.findById(threadId)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image"
      })
      .populate({
        path: "children",
        populate: [
          {
            path: "author",
            model: User,
            select: "_id id name parentId image"
          },
          {
            path: "children",
            model: Thread,
            populate: {
              path: "author",
              model: User,
              select: "_id id name parentId image"
            }
          }
        ]
      }).exec();
    return thread;
  } catch (error: any) {
    console.error("Failed to fetch thread", error.message);
  }
}

export async function addCommentToThread({ threadId, commentText, userId, path }: AddCommentToThreadParams) {
  connectDatabase();
  try {
    const originalThread = await Thread.findById(threadId);
    if (!originalThread) throw new Error("Thread not found");
    const commentThread = new Thread({
      text: commentText,
      author: userId,
      parentId: threadId
    });
    const saveCommentThread = await commentThread.save();
    originalThread.children.push(saveCommentThread._id);
    await originalThread.save();
    revalidatePath(path);
  } catch (error: any) {
    console.error("Failed to add comment to thread", error.message);
  }
}