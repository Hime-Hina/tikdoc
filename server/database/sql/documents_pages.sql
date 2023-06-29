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