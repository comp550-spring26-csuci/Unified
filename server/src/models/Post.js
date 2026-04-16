const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    community: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Community', 
      required: true, 
      index: true 
    },
    author: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      index: true 
    },
    text: { 
      type: String, 
      trim: true, 
      maxlength: 5000 
    },

    /** Event linked to post */
    event: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Event' 
    },

    /** ✅ Store uploaded image paths */
    images: { 
      type: [String], 
      default: [] 
    },

    likes: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
