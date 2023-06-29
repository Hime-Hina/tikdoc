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

CREATE INDEX IF NOT EXISTS documents_pages_content_index_for_highlight
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
                '"unify_alphabet", false, '
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
