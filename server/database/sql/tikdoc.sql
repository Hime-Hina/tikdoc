-- database: tikdoc
-- drop database if exists tikdoc;
create database tikdoc
    with
    owner = postgres
    encoding = 'utf8'
    lc_collate = 'zh_cn.utf-8'
    lc_ctype = 'zh_cn.utf-8'
    tablespace = pg_default
    connection limit = -1
    is_template = false;

create extension pgroonga; -- https://pgroonga.github.io/

-- table: public.accessible_directories
-- drop table if exists public.accessible_directories;
create table if not exists public.accessible_directories (
    id integer not null generated always as identity ( increment 1 start 1 minvalue 1 maxvalue 2147483647 cache 1 ),
    directory_path character varying(1023) collate pg_catalog."default" not null,
    description text collate pg_catalog."default" not null default ''::text,
    is_indexed boolean not null default false,
    constraint accessible_directories_pkey primary key (id),
    constraint accessible_directories_directory_path_key unique (directory_path)
)
tablespace pg_default;
alter table if exists public.accessible_directories owner to postgres;

-- insert into accessible_directories (directory_path, description)
-- values ('<前端可访问的路径>', '[描述]'),
--        ('...', '...'),
--        ('...', '...');
    
-- table: public.documents
-- drop table if exists public.documents;
create table if not exists public.documents (
    id integer not null generated always as identity ( increment 1 start 1 minvalue 1 maxvalue 2147483647 cache 1 ),
    absolute_path character varying(1023) collate pg_catalog."default" not null,
    creation_time time with time zone not null default current_time,
    update_time time with time zone not null default current_time,
    title text collate pg_catalog."default" not null default ''::text,
    author text collate pg_catalog."default" not null default ''::text,
    directory_id integer not null,
    constraint documents_info_pkey primary key (id),
    constraint documents_absolute_path_key unique (absolute_path),
    constraint documents_directory_id_fkey foreign key (directory_id)
        references public.accessible_directories (id) match simple
        on update no action
        on delete no action
)
tablespace pg_default;
alter table if exists public.documents owner to postgres;

-- table: public.documents_pages
-- drop table if exists public.documents_pages;
create table if not exists public.documents_pages
(
    id integer not null generated always as identity ( increment 1 start 1 minvalue 1 maxvalue 2147483647 cache 1 ),
    document_id integer not null,
    page_num integer not null,
    content text collate pg_catalog."default" not null,
    constraint documents_pages_pkey primary key (id),
    constraint documents_pages_document_id_page_num_key unique (document_id, page_num),
    constraint documents_pages_document_id_fkey foreign key (document_id)
        references public.documents (id) match simple
        on update cascade
        on delete cascade,
    constraint documents_pages_page_num_check check (page_num > 0)
)
tablespace pg_default;
alter table if exists public.documents_pages
    owner to postgres;

create index if not exists documents_pages_content_index
on documents_pages
using pgroonga (
  content pgroonga_text_full_text_search_ops_v2
)
include (id, document_id, page_num)
with (
  tokenizer='tokenngram('
               '"n", 1, '
                '"loose_symbol", true, '
                '"loose_blank", true, '
                '"report_source_location", true, '
                '"unify_alphabet", true, '
                '"unify_symbol", false, '
                '"unify_digit", false'
                ')',
  plugins='token_filters/stem', -- 需要安装插件
  token_filters='tokenfilterstem'
);

create index if not exists documents_pages_content_index_for_highlight
on documents_pages
using pgroonga (
  content pgroonga_text_full_text_search_ops_v2
)
include (id, document_id, page_num)
with (
  tokenizer='tokenngram('
               '"n", 1, '
                '"loose_symbol", true, '
                '"loose_blank", true, '
                '"report_source_location", true, '
                '"unify_alphabet", false, '
                '"unify_symbol", false, '
                '"unify_digit", false'
                ')',
  plugins='token_filters/stem', -- 需要安装插件
  token_filters='tokenfilterstem'
);

create index if not exists documents_absolute_path_index
on documents
using pgroonga (
  absolute_path pgroonga_varchar_term_search_ops_v2
)
include (id)
with (
  prefix_search_normalizer='' -- 不对路径做归一化
);

create index if not exists documents_title_author_index
on documents
using pgroonga (
  title pgroonga_text_full_text_search_ops_v2,
  author pgroonga_text_full_text_search_ops_v2
)
include (id)
with (
  tokenizer='tokenngram('
               '"n", 1, '
                '"loose_symbol", true, '
                '"loose_blank", true, '
                '"report_source_location", true, '
                '"unify_alphabet", true, '
                '"unify_symbol", false, '
                '"unify_digit", false'
                ')',
  plugins='token_filters/stem', -- 需要安装插件
  token_filters='tokenfilterstem'
);

create index if not exists accessible_directories_directory_path_index
on accessible_directories
using pgroonga (
  directory_path pgroonga_varchar_term_search_ops_v2
)
include (id)
with (
  prefix_search_normalizer='' -- 不对路径做归一化
);
