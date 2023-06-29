-- Table: public.documents

-- DROP TABLE IF EXISTS public.documents;

CREATE TABLE IF NOT EXISTS public.documents
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    absolute_path character varying(1023) COLLATE pg_catalog."default" NOT NULL,
    creation_time time with time zone NOT NULL DEFAULT CURRENT_TIME,
    update_time time with time zone NOT NULL DEFAULT CURRENT_TIME,
    title text COLLATE pg_catalog."default" NOT NULL DEFAULT ''::text,
    author text COLLATE pg_catalog."default" NOT NULL DEFAULT ''::text,
    directory_id integer NOT NULL,
    CONSTRAINT documents_info_pkey PRIMARY KEY (id),
    CONSTRAINT documents_absolute_path_key UNIQUE (absolute_path),
    CONSTRAINT documents_directory_id_fkey FOREIGN KEY (directory_id)
        REFERENCES public.accessible_directories (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.documents
    OWNER to postgres;