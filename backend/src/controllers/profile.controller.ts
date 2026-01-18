import { Request, Response } from "express";
import { UserModel } from "../models/User.model";
import { success, failure } from "../utils/apiResponse";

export async function updateProfile(req: Request & { user?: any }, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json(failure("Unauthorized"));
    }

    const {
        department,
        phone,
        avatarUrl,
        bio,
        specialization,
        qualifications,
        officeLocation,
        officeHours,
        studentId,
        skills,
        semester,
        profileCompleted
    } = req.body as any;

    const user = await UserModel.findById(userId);

    if (!user) {
        return res.status(404).json(failure("User not found"));
    }

    // Update fields
    if (department !== undefined) user.department = department;
    if (phone !== undefined) user.phone = phone;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (bio !== undefined) user.bio = bio;
    if (specialization !== undefined) user.specialization = specialization;
    if (qualifications !== undefined) user.qualifications = qualifications;
    if (officeLocation !== undefined) user.officeLocation = officeLocation;
    if (officeHours !== undefined) user.officeHours = officeHours;
    if (studentId !== undefined) user.studentId = studentId;
    if (skills !== undefined) user.skills = skills;
    if (semester !== undefined) user.semester = semester;
    if (profileCompleted !== undefined) user.profileCompleted = profileCompleted;

    await user.save();

    return res.json(success({
        message: "Profile updated successfully",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            specialization: user.specialization,
            qualifications: user.qualifications,
            officeLocation: user.officeLocation,
            profileCompleted: user.profileCompleted
        }
    }));
}

export async function getProfile(req: Request & { user?: any }, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json(failure("Unauthorized"));
    }

    const user = await UserModel.findById(userId).select('-passwordHash -emailVerificationToken -passwordResetToken');

    if (!user) {
        return res.status(404).json(failure("User not found"));
    }

    return res.json(success(user));
}
