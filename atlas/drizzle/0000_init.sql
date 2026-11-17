CREATE TYPE "public"."artist_kind" AS ENUM('dj', 'producer', 'group', 'live-act', 'dj-producer');--> statement-breakpoint
CREATE TYPE "public"."coord_precision" AS ENUM('address', 'approximate', 'city');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('continent', 'country', 'city', 'venue', 'festival', 'edition', 'event', 'artist', 'genre', 'label', 'era', 'milestone', 'route');--> statement-breakpoint
CREATE TYPE "public"."event_category" AS ENUM('club-night', 'warehouse-rave', 'underground-party', 'open-air', 'boat-party', 'beach-party', 'festival-afterparty', 'dj-showcase', 'label-night', 'live-performance', 'multi-day-rave');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('announced', 'on-sale', 'sold-out', 'postponed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."favorite_kind" AS ENUM('favorite', 'visited', 'saved');--> statement-breakpoint
CREATE TYPE "public"."festival_status" AS ENUM('active', 'ended', 'on-hiatus', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."festival_type" AS ENUM('mega', 'techno', 'art-tech', 'boutique', 'hard-dance', 'transformational', 'city', 'parade');--> statement-breakpoint
CREATE TYPE "public"."genre_family" AS ENUM('house', 'techno', 'trance', 'bass', 'hard-dance', 'other');--> statement-breakpoint
CREATE TYPE "public"."genre_relation" AS ENUM('derived-from', 'influenced-by', 'fusion-of', 'related');--> statement-breakpoint
CREATE TYPE "public"."publish_state" AS ENUM('draft', 'review', 'published', 'unpublished');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'editor', 'researcher', 'user');--> statement-breakpoint
CREATE TYPE "public"."venue_kind" AS ENUM('club', 'concert-hall', 'warehouse', 'open-air', 'festival-site', 'cultural-center');--> statement-breakpoint
CREATE TYPE "public"."venue_status" AS ENUM('active', 'closed', 'historical', 'relocated', 'seasonal', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('verified', 'unverified', 'historical', 'outdated', 'unknown');--> statement-breakpoint
CREATE TABLE "artist_genres" (
	"artist_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "artist_genres_artist_id_genre_id_pk" PRIMARY KEY("artist_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "artist_labels" (
	"artist_id" uuid NOT NULL,
	"label_id" uuid NOT NULL,
	CONSTRAINT "artist_labels_artist_id_label_id_pk" PRIMARY KEY("artist_id","label_id")
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_ru" text NOT NULL,
	"name_en" text,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"summary_ru" text NOT NULL,
	"summary_en" text,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"facts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verification" "verification_status" DEFAULT 'unverified' NOT NULL,
	"checked_at" timestamp with time zone,
	"publish_state" "publish_state" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"real_name" text,
	"kind" "artist_kind" NOT NULL,
	"country_id" uuid NOT NULL,
	"city_id" uuid,
	"origin_note" jsonb,
	"career_start_year" integer,
	"releases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"website" text
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_ru" text NOT NULL,
	"name_en" text,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"summary_ru" text NOT NULL,
	"summary_en" text,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"facts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verification" "verification_status" DEFAULT 'unverified' NOT NULL,
	"checked_at" timestamp with time zone,
	"publish_state" "publish_state" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"coord_precision" "coord_precision",
	"location" geometry(Point, 4326),
	"country_id" uuid NOT NULL,
	"is_music_capital" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "city_genres" (
	"city_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "city_genres_city_id_genre_id_pk" PRIMARY KEY("city_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "continents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_ru" text NOT NULL,
	"name_en" text,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"summary_ru" text NOT NULL,
	"summary_en" text,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"facts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verification" "verification_status" DEFAULT 'unverified' NOT NULL,
	"checked_at" timestamp with time zone,
	"publish_state" "publish_state" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"center_lng" double precision NOT NULL,
	"center_lat" double precision NOT NULL,
	"zoom" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_ru" text NOT NULL,
	"name_en" text,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"summary_ru" text NOT NULL,
	"summary_en" text,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"facts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verification" "verification_status" DEFAULT 'unverified' NOT NULL,
	"checked_at" timestamp with time zone,
	"publish_state" "publish_state" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"continent_id" uuid NOT NULL,
	"iso2" text NOT NULL,
	"iso_numeric" text NOT NULL,
	"center_lng" double precision NOT NULL,
	"center_lat" double precision NOT NULL,
	"zoom" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "country_genres" (
	"country_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "country_genres_country_id_genre_id_pk" PRIMARY KEY("country_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "edition_lineups" (
	"edition_id" uuid NOT NULL,
	"artist_id" uuid NOT NULL,
	CONSTRAINT "edition_lineups_edition_id_artist_id_pk" PRIMARY KEY("edition_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "entity_sources" (
	"entity_type" "entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"source_id" text NOT NULL,
	"note" text,
	"checked_at" timestamp with time zone,
	CONSTRAINT "entity_sources_entity_type_entity_id_source_id_pk" PRIMARY KEY("entity_type","entity_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "eras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_ru" text NOT NULL,
	"name_en" text,
	"start_year" integer NOT NULL,
	"end_year" integer NOT NULL,
	"summary_ru" text NOT NULL,
	"summary_en" text,
	"context_ru" text NOT NULL,
	"context_en" text,
	"releases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"links" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_genres" (
	"event_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "event_genres_event_id_genre_id_pk" PRIMARY KEY("event_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "event_lineups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"artist_id" uuid,
	"artist_name" text NOT NULL,
	"billing_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text,
	"provider" text DEFAULT 'manual' NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"category" "event_category" NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"city_id" uuid,
	"venue_id" uuid,
	"festival_edition_id" uuid,
	"venue_name" text NOT NULL,
	"address" text,
	"lat" double precision,
	"lng" double precision,
	"coord_precision" "coord_precision",
	"location" geometry(Point, 4326),
	"organizer" text,
	"description_ru" text,
	"description_en" text,
	"age_restriction" text,
	"price" text,
	"official_url" text NOT NULL,
	"image_url" text,
	"status" "event_status" NOT NULL,
	"verification" "verification_status" DEFAULT 'unverified' NOT NULL,
	"checked_at" timestamp with time zone NOT NULL,
	"publish_state" "publish_state" DEFAULT 'review' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"user_id" uuid NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"kind" "favorite_kind" DEFAULT 'favorite' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_user_id_entity_type_entity_id_kind_pk" PRIMARY KEY("user_id","entity_type","entity_id","kind")
);
--> statement-breakpoint
CREATE TABLE "festival_artists" (
	"festival_id" uuid NOT NULL,
	"artist_id" uuid NOT NULL,
	CONSTRAINT "festival_artists_festival_id_artist_id_pk" PRIMARY KEY("festival_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "festival_editions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"festival_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"start_date" date,
	"end_date" date,
	"status" "event_status" NOT NULL,
	"verification" "verification_status" DEFAULT 'unverified' NOT NULL,
	"checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "festival_genres" (
	"festival_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "festival_genres_festival_id_genre_id_pk" PRIMARY KEY("festival_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "festivals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_ru" text NOT NULL,
	"name_en" text,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"summary_ru" text NOT NULL,
	"summary_en" text,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"facts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verification" "verification_status" DEFAULT 'unverified' NOT NULL,
	"checked_at" timestamp with time zone,
	"publish_state" "publish_state" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"coord_precision" "coord_precision",
	"location" geometry(Point, 4326),
	"city_id" uuid NOT NULL,
	"venue_name" text,
	"founded_year" integer,
	"ended_year" integer,
	"status" "festival_status" DEFAULT 'unknown' NOT NULL,
	"type" "festival_type" NOT NULL,
	"usual_months" integer[] DEFAULT '{}'::integer[] NOT NULL,
	"usual_duration_days" integer,
	"attendance" jsonb,
	"concept" jsonb,
	"website" text
);
--> statement-breakpoint
CREATE TABLE "genre_key_artists" (
	"genre_id" uuid NOT NULL,
	"artist_id" uuid NOT NULL,
	CONSTRAINT "genre_key_artists_genre_id_artist_id_pk" PRIMARY KEY("genre_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "genre_labels" (
	"genre_id" uuid NOT NULL,
	"label_id" uuid NOT NULL,
	CONSTRAINT "genre_labels_genre_id_label_id_pk" PRIMARY KEY("genre_id","label_id")
);
--> statement-breakpoint
CREATE TABLE "genre_origin_cities" (
	"genre_id" uuid NOT NULL,
	"city_id" uuid NOT NULL,
	CONSTRAINT "genre_origin_cities_genre_id_city_id_pk" PRIMARY KEY("genre_id","city_id")
);
--> statement-breakpoint
CREATE TABLE "genre_relationships" (
	"from_genre_id" uuid NOT NULL,
	"to_genre_id" uuid NOT NULL,
	"type" "genre_relation" NOT NULL,
	CONSTRAINT "genre_relationships_from_genre_id_to_genre_id_type_pk" PRIMARY KEY("from_genre_id","to_genre_id","type")
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_ru" text NOT NULL,
	"name_en" text,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"summary_ru" text NOT NULL,
	"summary_en" text,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"facts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verification" "verification_status" DEFAULT 'unverified' NOT NULL,
	"checked_at" timestamp with time zone,
	"publish_state" "publish_state" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"family" "genre_family" NOT NULL,
	"parent_id" uuid,
	"origin_note" jsonb,
	"period_start" integer,
	"bpm_min" integer,
	"bpm_max" integer,
	"characteristics" jsonb NOT NULL,
	"rhythm" jsonb,
	"instruments" text[] DEFAULT '{}'::text[] NOT NULL,
	"key_artist_names" text[] DEFAULT '{}'::text[] NOT NULL,
	"key_releases" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historical_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"year" integer NOT NULL,
	"era_id" uuid NOT NULL,
	"title_ru" text NOT NULL,
	"title_en" text,
	"summary_ru" text NOT NULL,
	"summary_en" text,
	"city_id" uuid,
	"lat" double precision,
	"lng" double precision,
	"coord_precision" "coord_precision",
	"location" geometry(Point, 4326),
	"links" jsonb NOT NULL,
	"verification" "verification_status" DEFAULT 'historical' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "label_founders" (
	"label_id" uuid NOT NULL,
	"artist_id" uuid NOT NULL,
	CONSTRAINT "label_founders_label_id_artist_id_pk" PRIMARY KEY("label_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "label_genres" (
	"label_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "label_genres_label_id_genre_id_pk" PRIMARY KEY("label_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"url" text NOT NULL,
	"thumb_url" text,
	"width" integer,
	"height" integer,
	"alt_ru" text NOT NULL,
	"alt_en" text,
	"caption_ru" text,
	"caption_en" text,
	"author" text NOT NULL,
	"license" text NOT NULL,
	"license_url" text NOT NULL,
	"source_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"city_id" uuid NOT NULL,
	"name_ru" text NOT NULL,
	"name_en" text,
	"summary_ru" text NOT NULL,
	"summary_en" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "record_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_ru" text NOT NULL,
	"name_en" text,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"summary_ru" text NOT NULL,
	"summary_en" text,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"facts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verification" "verification_status" DEFAULT 'unverified' NOT NULL,
	"checked_at" timestamp with time zone,
	"publish_state" "publish_state" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"city_id" uuid,
	"country_id" uuid NOT NULL,
	"founded_year" integer,
	"website" text
);
--> statement-breakpoint
CREATE TABLE "route_stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"venue_id" uuid,
	"title_ru" text NOT NULL,
	"description_ru" text NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"coord_precision" "coord_precision",
	"location" geometry(Point, 4326)
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"publisher" text NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"password_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venue_genres" (
	"venue_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "venue_genres_venue_id_genre_id_pk" PRIMARY KEY("venue_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "venue_residents" (
	"venue_id" uuid NOT NULL,
	"artist_id" uuid NOT NULL,
	CONSTRAINT "venue_residents_venue_id_artist_id_pk" PRIMARY KEY("venue_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_ru" text NOT NULL,
	"name_en" text,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"summary_ru" text NOT NULL,
	"summary_en" text,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"facts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verification" "verification_status" DEFAULT 'unverified' NOT NULL,
	"checked_at" timestamp with time zone,
	"publish_state" "publish_state" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"coord_precision" "coord_precision",
	"location" geometry(Point, 4326),
	"city_id" uuid NOT NULL,
	"kind" "venue_kind" DEFAULT 'club' NOT NULL,
	"address" text,
	"opened_year" integer,
	"closed_year" integer,
	"status" "venue_status" DEFAULT 'unknown' NOT NULL,
	"legendary" boolean DEFAULT false NOT NULL,
	"resident_names" text[] DEFAULT '{}'::text[] NOT NULL,
	"architecture" jsonb,
	"sound_system" jsonb,
	"capacity" integer,
	"website" text,
	"socials" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "artist_genres" ADD CONSTRAINT "artist_genres_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_genres" ADD CONSTRAINT "artist_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_labels" ADD CONSTRAINT "artist_labels_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_labels" ADD CONSTRAINT "artist_labels_label_id_record_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."record_labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "city_genres" ADD CONSTRAINT "city_genres_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "city_genres" ADD CONSTRAINT "city_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "countries" ADD CONSTRAINT "countries_continent_id_continents_id_fk" FOREIGN KEY ("continent_id") REFERENCES "public"."continents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "country_genres" ADD CONSTRAINT "country_genres_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "country_genres" ADD CONSTRAINT "country_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edition_lineups" ADD CONSTRAINT "edition_lineups_edition_id_festival_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."festival_editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edition_lineups" ADD CONSTRAINT "edition_lineups_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_sources" ADD CONSTRAINT "entity_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_genres" ADD CONSTRAINT "event_genres_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_genres" ADD CONSTRAINT "event_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_lineups" ADD CONSTRAINT "event_lineups_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_lineups" ADD CONSTRAINT "event_lineups_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_festival_edition_id_festival_editions_id_fk" FOREIGN KEY ("festival_edition_id") REFERENCES "public"."festival_editions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "festival_artists" ADD CONSTRAINT "festival_artists_festival_id_festivals_id_fk" FOREIGN KEY ("festival_id") REFERENCES "public"."festivals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "festival_artists" ADD CONSTRAINT "festival_artists_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "festival_editions" ADD CONSTRAINT "festival_editions_festival_id_festivals_id_fk" FOREIGN KEY ("festival_id") REFERENCES "public"."festivals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "festival_genres" ADD CONSTRAINT "festival_genres_festival_id_festivals_id_fk" FOREIGN KEY ("festival_id") REFERENCES "public"."festivals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "festival_genres" ADD CONSTRAINT "festival_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "festivals" ADD CONSTRAINT "festivals_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genre_key_artists" ADD CONSTRAINT "genre_key_artists_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genre_key_artists" ADD CONSTRAINT "genre_key_artists_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genre_labels" ADD CONSTRAINT "genre_labels_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genre_labels" ADD CONSTRAINT "genre_labels_label_id_record_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."record_labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genre_origin_cities" ADD CONSTRAINT "genre_origin_cities_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genre_origin_cities" ADD CONSTRAINT "genre_origin_cities_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genre_relationships" ADD CONSTRAINT "genre_relationships_from_genre_id_genres_id_fk" FOREIGN KEY ("from_genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genre_relationships" ADD CONSTRAINT "genre_relationships_to_genre_id_genres_id_fk" FOREIGN KEY ("to_genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_milestones" ADD CONSTRAINT "historical_milestones_era_id_eras_id_fk" FOREIGN KEY ("era_id") REFERENCES "public"."eras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_milestones" ADD CONSTRAINT "historical_milestones_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "label_founders" ADD CONSTRAINT "label_founders_label_id_record_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."record_labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "label_founders" ADD CONSTRAINT "label_founders_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "label_genres" ADD CONSTRAINT "label_genres_label_id_record_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."record_labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "label_genres" ADD CONSTRAINT "label_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_routes" ADD CONSTRAINT "music_routes_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_labels" ADD CONSTRAINT "record_labels_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_labels" ADD CONSTRAINT "record_labels_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_route_id_music_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."music_routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_genres" ADD CONSTRAINT "venue_genres_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_genres" ADD CONSTRAINT "venue_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_residents" ADD CONSTRAINT "venue_residents_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_residents" ADD CONSTRAINT "venue_residents_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "artists_slug_idx" ON "artists" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "cities_slug_idx" ON "cities" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "cities_location_gix" ON "cities" USING gist ("location");--> statement-breakpoint
CREATE UNIQUE INDEX "continents_slug_idx" ON "continents" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "countries_slug_idx" ON "countries" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "countries_iso2_idx" ON "countries" USING btree ("iso2");--> statement-breakpoint
CREATE UNIQUE INDEX "eras_slug_idx" ON "eras" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_start_idx" ON "events" USING btree ("start_at");--> statement-breakpoint
CREATE UNIQUE INDEX "events_provider_ext_idx" ON "events" USING btree ("provider","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "festival_editions_year_idx" ON "festival_editions" USING btree ("festival_id","year");--> statement-breakpoint
CREATE UNIQUE INDEX "festivals_slug_idx" ON "festivals" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "festivals_location_gix" ON "festivals" USING gist ("location");--> statement-breakpoint
CREATE UNIQUE INDEX "genres_slug_idx" ON "genres" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "milestones_slug_idx" ON "historical_milestones" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "milestones_year_idx" ON "historical_milestones" USING btree ("year");--> statement-breakpoint
CREATE UNIQUE INDEX "routes_slug_idx" ON "music_routes" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "record_labels_slug_idx" ON "record_labels" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "venues_slug_idx" ON "venues" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "venues_location_gix" ON "venues" USING gist ("location");--> statement-breakpoint
CREATE INDEX "venues_city_idx" ON "venues" USING btree ("city_id");