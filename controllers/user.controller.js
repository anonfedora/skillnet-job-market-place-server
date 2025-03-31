const User = require('../models/User');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('savedJobs', 'title company');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { fullName, location, bio, skills, profilePicture } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        'profile.fullName': fullName,
        'profile.location': location,
        'profile.bio': bio,
        'profile.skills': skills,
        'profile.profilePicture': profilePicture
      },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

exports.addCertification = async (req, res) => {
  try {
    const { title, provider, issueDate, certId, verificationLink } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $push: {
          certifications: {
            title,
            provider,
            issueDate,
            certId,
            verificationLink
          }
        }
      },
      { new: true }
    ).select('certifications');

    res.status(201).json({
      success: true,
      message: 'Certification added successfully',
      data: user.certifications
    });
  } catch (error) {
    console.error('Add certification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add certification',
      error: error.message
    });
  }
};

exports.removeCertification = async (req, res) => {
  try {
    const certificationId = req.params.id;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $pull: {
          certifications: { _id: certificationId }
        }
      },
      { new: true }
    ).select('certifications');

    res.status(200).json({
      success: true,
      message: 'Certification removed successfully',
      data: user.certifications
    });
  } catch (error) {
    console.error('Remove certification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove certification',
      error: error.message
    });
  }
};