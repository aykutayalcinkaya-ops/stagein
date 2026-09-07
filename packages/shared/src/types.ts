export type ReactionType = 'like' | 'love' | 'wow' | 'sad' | 'angry' | 'haha'

export interface PostReaction {
  id: string
  post_id: string
  user_id: string
  reaction_type: ReactionType
  created_at: string
  user?: User
}

export interface VideoReaction {
  id: string
  video_id: string
  user_id: string
  reaction_type: ReactionType
  created_at: string
  user?: User
}

export interface PostCommentReply {
  id: string
  comment_id: string
  user_id: string
  body: string
  created_at: string
  user?: User
}

export interface PostShare {
  id: string
  post_id: string
  user_id: string
  shared_to_wall: boolean
  caption: string | null
  created_at: string
  user?: User
}

export interface VideoShare {
  id: string
  video_id: string
  user_id: string
  shared_to_wall: boolean
  caption: string | null
  created_at: string
  user?: User
}

export type UserRole = 'musician' | 'studio' | 'teacher' | 'admin'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'professional'
export type BadgeType = 'blue' | 'grey'
export type BadgeStatus = 'pending' | 'approved' | 'rejected'
export type ListingType = 'band' | 'session' | 'lesson' | 'venue'
export type ListingStatus = 'active' | 'closed' | 'expired'
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'
export type MarketplaceStatus = 'active' | 'sold' | 'reserved'
export type ContextType = 'video' | 'listing' | 'direct'

export interface User {
  id: string
  email: string
  username: string
  full_name: string | null
  avatar_url: string | null
  city: string | null
  bio: string | null
  role: UserRole
  created_at: string
}

export interface MusicianProfile {
  user_id: string
  instruments: string[]
  genres: string[]
  experience_level: ExperienceLevel
  is_open_to_gig: boolean
}

export type VideoSource = 'upload' | 'youtube' | 'vimeo'

export interface Video {
  id: string
  user_id: string
  storage_path: string | null
  hls_url: string | null
  thumbnail_url: string | null
  duration: number | null
  city: string | null
  instruments: string[]
  genres: string[]
  reactions: Record<ReactionType, number>
  share_count: number
  view_count: number
  created_at: string
  youtube_url?: string | null
  video_source?: VideoSource
  title?: string | null
  description?: string | null
  user?: User
  liked_by_me?: boolean
  my_reaction?: ReactionType | null
}

export interface Listing {
  id: string
  user_id: string
  type: ListingType
  title: string
  description: string | null
  city: string | null
  instruments: string[]
  genres: string[]
  experience_level: ExperienceLevel | null
  is_paid: boolean
  status: ListingStatus
  expires_at: string
  budget_min?: number | null
  budget_max?: number | null
  event_date?: string | null
  venue_name?: string | null
  created_at: string
  user?: User
}

export interface ListingApplication {
  id: string
  listing_id: string
  applicant_id: string
  message: string
  sample_video_id?: string | null
  status: ApplicationStatus
  created_at: string
  listing?: Listing
  applicant?: User
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  audio_url: string | null
  context_type: ContextType
  context_id: string | null
  created_at: string
  sender?: User
}

export interface Conversation {
  id: string
  participant_ids: string[]
  last_message_at: string
  participants?: User[]
  last_message?: Message
}

export interface Booking {
  id: string
  studio_id: string
  user_id: string
  start_time: string
  end_time: string
  total_price: number | null
  status: BookingStatus
  payment_id: string | null
  created_at: string
}

export interface MarketplaceItem {
  id: string
  seller_id: string
  title: string
  description: string | null
  photos: string[]
  price: number | null
  city: string | null
  status: MarketplaceStatus
  brand?: string | null
  model?: string | null
  condition?: 'brand_new' | 'like_new' | 'very_good' | 'good' | 'needs_repair' | null
  category?: string | null
  is_open_to_trade?: boolean
  view_count?: number
  created_at: string
  seller?: User
}

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'countered' | 'cancelled'

export interface MarketplaceOffer {
  id: string
  item_id: string
  buyer_id: string
  seller_id: string
  offer_amount: number
  message?: string | null
  status: OfferStatus
  counter_amount?: number | null
  created_at: string
  item?: MarketplaceItem
  buyer?: User
  seller?: User
}

export interface Endorsement {
  id: string
  from_user_id: string
  to_user_id: string
  note: string | null
  created_at: string
  from_user?: User
}

export interface BadgeApplication {
  id: string
  user_id: string
  badge_type: BadgeType
  documents: string[]
  status: BadgeStatus
  reviewed_by: string | null
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  body: string | null
  video_id: string | null
  photo_urls: string[]
  reactions: Record<ReactionType, number>
  share_count: number
  comment_count: number
  created_at: string
  updated_at?: string | null
  user?: User
  video?: Video
  liked_by_me?: boolean
  my_reaction?: ReactionType | null
}

export type PostReportReason = 'spam' | 'harassment' | 'inappropriate' | 'other'

export interface PostReport {
  id: string
  post_id: string
  reporter_id: string
  reason: PostReportReason
  created_at: string
}

export interface PostComment {
  id: string
  post_id: string
  user_id: string
  body: string
  created_at: string
  user?: User
  reply_count: number
  replies?: PostCommentReply[]
}

export interface ProfileLink {
  id: string
  user_id: string
  label: string
  url: string
  position: number
}

// ---------------------------------------------------------------------------
// Freelance (hizmet ilanları / gigs)
// ---------------------------------------------------------------------------

export type FreelanceGigStatus = 'active' | 'paused' | 'draft'
export type FreelancePackageTier = 'basic' | 'standard' | 'premium'
export type FreelanceOrderStatus =
  | 'requirements_pending'
  | 'in_progress'
  | 'delivered'
  | 'revision_requested'
  | 'completed'
  | 'cancelled'
  | 'disputed'

export interface FreelanceCategory {
  id: string
  name: string
  icon: string | null
  description: string | null
}

export interface FreelanceAudioSample {
  title: string
  url: string
  duration: number
}

export interface FreelanceFaqItem {
  question: string
  answer: string
}

export interface FreelanceGig {
  id: string
  seller_id: string
  category_id: string
  title: string
  slug: string | null
  description: string
  cover_image: string | null
  audio_samples: FreelanceAudioSample[]
  faq: FreelanceFaqItem[]
  requirements: string | null
  rating_avg: number
  rating_count: number
  order_queue_count: number
  status: FreelanceGigStatus
  created_at: string
  seller?: User
  category?: FreelanceCategory
  packages?: FreelancePackage[]
  reviews?: FreelanceReview[]
}

export interface FreelancePackageFeatures {
  wav_delivery?: boolean
  mp3_delivery?: boolean
  stem_delivery?: boolean
  commercial_rights?: boolean
}

export interface FreelancePackage {
  id: string
  gig_id: string
  tier: FreelancePackageTier
  title: string
  description: string
  delivery_days: number
  revisions_count: number
  price: number
  features: FreelancePackageFeatures
  created_at: string
}

export interface FreelanceOrder {
  id: string
  gig_id: string
  package_id: string
  buyer_id: string
  seller_id: string
  price: number
  status: FreelanceOrderStatus
  requirements_submitted: string | null
  delivered_files: { name: string; url: string }[]
  delivery_note: string | null
  delivered_at: string | null
  auto_complete_at: string | null
  created_at: string
  gig?: FreelanceGig
  package?: FreelancePackage
  buyer?: User
  seller?: User
}

export interface FreelanceReview {
  id: string
  order_id: string
  gig_id: string
  buyer_id: string
  seller_id: string
  rating: number
  comment: string | null
  seller_reply: string | null
  created_at: string
  buyer?: User
}
