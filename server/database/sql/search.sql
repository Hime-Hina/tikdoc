  select
    id,
    document_id,
    page_num,
    pgroonga_score(tableoid, ctid) as score,
    pgroonga_highlight_html(
      content,
      pgroonga_query_extract_keywords('absurd'),
      'documents_pages_content_index_for_highlight'
    ) as highlighted_content
  from documents_pages
  where id in (
    select id
    from documents_pages
    where document_id in (
      select id
      from documents
      where pgroonga_prefix_in_varchar_conditions(
        absolute_path,
        Array[
          '/home/himehina/WorkingSpace/tikdoc/temp/documents/pdf/',
          '/home/himehina/WorkingSpace/tikdoc/temp/documents/docx',
          '/mnt/k/Documents'
        ],
        'documents_absolute_path_index'
      )
    ) and content &@~ 'absurd'
  )
  order by document_id, page_num, pgroonga_score(tableoid, ctid) desc
--   limit 10 offset 10

-- SELECT * FROM search_documents_pages(
--   '你輸啦轉身走向廳門',
--   ARRAY[
--     '/home/himehina/WorkingSpace/tikdoc/temp/documents/pdf/',
--     '/home/himehina/WorkingSpace/tikdoc/temp/documents/docx'
--   ],
--   1000, 0
-- );