-- Table: public.accessible_directories

-- DROP TABLE IF EXISTS public.accessible_directories;

CREATE TABLE IF NOT EXISTS public.accessible_directories
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    directory_path character varying(1023) COLLATE pg_catalog."default" NOT NULL,
    description text COLLATE pg_catalog."default" NOT NULL DEFAULT ''::text,
    is_indexed boolean NOT NULL DEFAULT false,
    CONSTRAINT accessible_directories_pkey PRIMARY KEY (id),
    CONSTRAINT accessible_directories_directory_path_key UNIQUE (directory_path)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.accessible_directories
    OWNER to postgres;