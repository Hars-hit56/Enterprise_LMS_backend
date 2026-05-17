import Course from "../model/courseModel.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import Lecture from "../model/lectureModel.js";
import User from "../model/userModel.js";
import mongoose from "mongoose";

export const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      difficulty,
      price,
      currency,
      isFree,
      modules
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({ message: "Title or Category is required" });
    }

    let thumbnail;
    if (req.files && Array.isArray(req.files)) {
      const thumbnailFile = req.files.find(f => f.fieldname === 'thumbnail');
      if (thumbnailFile) {
        thumbnail = await uploadOnCloudinary(thumbnailFile.path);
      }
    } else if (req.file) { // Fallback if upload.single was used
      thumbnail = await uploadOnCloudinary(req.file.path);
    }

    let parsedModules = [];
    if (modules) {
      const modulesData = typeof modules === 'string' ? JSON.parse(modules) : modules;
      let moduleIndex = 0;
      for (const mod of modulesData) {
        const moduleLectures = [];
        if (mod.lessons && mod.lessons.length > 0) {
          let lessonIndex = 0;
          for (const lesson of mod.lessons) {
            let finalVideoUrl = lesson.video || null;

            // Check if there's an uploaded file for this lesson video
            if (req.files && Array.isArray(req.files)) {
              const expectedVideoField = `video_${moduleIndex}_${lessonIndex}`;
              const videoFile = req.files.find(f => f.fieldname === expectedVideoField);
              if (videoFile) {
                finalVideoUrl = await uploadOnCloudinary(videoFile.path);
              }
            }

            const lecture = await Lecture.create({
              lectureTitle: lesson.title,
              videoUrl: finalVideoUrl,
              isPreviewFree: lesson.isFree || false
            });
            moduleLectures.push(lecture._id);
            lessonIndex++;
          }
        }
        parsedModules.push({
          moduleTitle: mod.title,
          lectures: moduleLectures
        });
        moduleIndex++;
      }
    }

    const course = await Course.create({
      title,
      description,
      category,
      level: difficulty,
      price,
      currency,
      isFree: isFree === "true",
      thumbnail,
      modules: parsedModules,
      creator: req.userId,
    });
    return res.status(201).json(course);
  } catch (error) {
    return res.status(500).json({ message: `CreateCourse error ${error}` });
  }
};

// Controller check course is published or not

export const getPublishedCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true });

    if (!courses) {
      return res.status(400).json({ message: "Courses is not found" });
    }
    return res.status(200).json(courses);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Failed to get isPublished Courses  ${error}` });
  }
};

export const getCreatorCourses = async (req, res) => {
  try {
    const userId = req.userId;
    const courses = await Course.find({ creator: userId }).populate({
      path: 'modules.lectures',
      model: 'Lecture'
    });
    if (!courses) {
      return res.status(400).json({ message: "Courses are not found" });
    }
    return res.status(200).json(courses);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to get Creator Courses ${error}` });
  }
};

export const editCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const {
      title,
      subTitle,
      description,
      category,
      level,
      difficulty,
      isPublished,
      price,
      currency,
      isFree,
      modules
    } = req.body;

    let thumbnail;
    if (req.files && Array.isArray(req.files)) {
      const thumbnailFile = req.files.find(f => f.fieldname === 'thumbnail');
      if (thumbnailFile) {
        thumbnail = await uploadOnCloudinary(thumbnailFile.path);
      }
    } else if (req.file) {
      thumbnail = await uploadOnCloudinary(req.file.path);
    }

    let course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({ message: "Courses are not found" });
    }

    // Keep track of original lecture IDs to find out which ones got deleted
    const originalLectureIds = [];
    if (course.modules && course.modules.length > 0) {
      for (const mod of course.modules) {
        if (mod.lectures && mod.lectures.length > 0) {
          mod.lectures.forEach(lId => originalLectureIds.push(lId.toString()));
        }
      }
    }

    let parsedModules;
    const incomingLectureIds = []; // Track lectures kept by the frontend

    if (modules) {
      const modulesData = typeof modules === 'string' ? JSON.parse(modules) : modules;
      parsedModules = [];
      let moduleIndex = 0;
      for (const mod of modulesData) {
        const moduleLectures = [];
        if (mod.lessons && mod.lessons.length > 0) {
          let lessonIndex = 0;
          for (const lesson of mod.lessons) {
            let finalVideoUrl = lesson.video || null;

            // Check if there's an uploaded file for this lesson video
            if (req.files && Array.isArray(req.files)) {
              const expectedVideoField = `video_${moduleIndex}_${lessonIndex}`;
              const videoFile = req.files.find(f => f.fieldname === expectedVideoField);
              if (videoFile) {
                finalVideoUrl = await uploadOnCloudinary(videoFile.path);
              }
            }

            const lessonId = lesson.id || lesson._id;
            if (lessonId && mongoose.Types.ObjectId.isValid(lessonId)) {
              const updatePayload = {
                lectureTitle: lesson.title,
                isPreviewFree: lesson.isFree || false
              };
              if (finalVideoUrl) updatePayload.videoUrl = finalVideoUrl;

              await Lecture.findByIdAndUpdate(lessonId, updatePayload);
              moduleLectures.push(lessonId);
              incomingLectureIds.push(lessonId.toString());
            } else {
              const lecture = await Lecture.create({
                lectureTitle: lesson.title,
                videoUrl: finalVideoUrl,
                isPreviewFree: lesson.isFree || false
              });
              moduleLectures.push(lecture._id);
            }
            lessonIndex++;
          }
        }
        parsedModules.push({
          moduleTitle: mod.title,
          lectures: moduleLectures
        });
        moduleIndex++;
      }
    }

    // Delete orphaned lectures
    const lecturesToDelete = originalLectureIds.filter(id => !incomingLectureIds.includes(id));
    if (lecturesToDelete.length > 0) {
      await Lecture.deleteMany({ _id: { $in: lecturesToDelete } });
    }

    const updateData = {
      title,
      subTitle,
      description,
      category,
      level: difficulty || level,
      isPublished: isPublished === "true",
      price,
      currency,
      isFree: isFree === "true",
    };
    if (thumbnail) updateData.thumbnail = thumbnail;
    if (parsedModules) updateData.modules = parsedModules;

    course = await Course.findByIdAndUpdate(courseId, updateData, {
      new: true,
    }).populate({
      path: 'modules.lectures',
      model: 'Lecture'
    });
    return res.status(200).json(course);
  } catch (error) {
    return res.status(500).json({ message: `failed to edit Courses ${error}` });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;

    let course = await Course.findById(courseId).populate({
      path: 'modules.lectures',
      model: 'Lecture'
    });
    if (!course) {
      return res.status(400).json({ message: "Courses are not found" });
    }

    return res.status(200).json(course);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to get Courses by id ${error}` });
  }
};

export const removeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    let course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({ message: "Courses are not found" });
    }

    if (course.modules && course.modules.length > 0) {
      for (const mod of course.modules) {
        if (mod.lectures && mod.lectures.length > 0) {
          await Lecture.deleteMany({ _id: { $in: mod.lectures } });
        }
      }
    }

    await Course.findByIdAndDelete(courseId);

    return res.status(200).json({ message: "Course removed" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to Delete Courses  ${error}` });
  }
};



// Get the Creator

export const getCreatorById = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(400).json({ message: "User is not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Failed to get  Creator  ${error}` });
  }
};
