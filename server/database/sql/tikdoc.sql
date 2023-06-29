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

-- Table: public.documents_pages

-- DROP TABLE IF EXISTS public.documents_pages;

CREATE TABLE IF NOT EXISTS public.documents_pages
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    document_id integer NOT NULL,
    page_num integer NOT NULL,
    content text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT documents_pages_pkey PRIMARY KEY (id),
    CONSTRAINT documents_pages_document_id_page_num_key UNIQUE (document_id, page_num),
    CONSTRAINT documents_pages_document_id_fkey FOREIGN KEY (document_id)
        REFERENCES public.documents (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT documents_pages_page_num_check CHECK (page_num > 0)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.documents_pages
    OWNER to postgres;
    
CREATE INDEX IF NOT EXISTS documents_pages_content_index
ON documents_pages
USING pgroonga (
  content pgroonga_text_full_text_search_ops_v2
)
INCLUDE (id, document_id, page_num)
WITH (
  tokenizer='TokenNgram('
               '"n", 1, '
                '"loose_symbol", true, '
                '"loose_blank", true, '
                '"report_source_location", true, '
                '"unify_alphabet", true, '
                '"unify_symbol", false, '
                '"unify_digit", false'
                ')',
  plugins='token_filters/stem',
  token_filters='TokenFilterStem'
);
       
CREATE INDEX IF NOT EXISTS documents_absolute_path_index
ON documents
USING pgroonga (
  absolute_path pgroonga_varchar_term_search_ops_v2
)
INCLUDE (id)
WITH (
  prefix_search_normalizer=''
);

CREATE INDEX IF NOT EXISTS documents_title_author_index
ON documents
USING pgroonga (
  title pgroonga_text_full_text_search_ops_v2,
  author pgroonga_text_full_text_search_ops_v2
)
INCLUDE (id)
WITH (
  tokenizer='TokenNgram('
               '"n", 1, '
                '"loose_symbol", true, '
                '"loose_blank", true, '
                '"report_source_location", true, '
                '"unify_alphabet", true, '
                '"unify_symbol", false, '
                '"unify_digit", false'
                ')',
  plugins='token_filters/stem',
  token_filters='TokenFilterStem'
);

CREATE INDEX IF NOT EXISTS accessible_directories_directory_path_index
ON accessible_directories
USING pgroonga (
  directory_path pgroonga_varchar_term_search_ops_v2
)
INCLUDE (id)
WITH (
  prefix_search_normalizer=''
);
