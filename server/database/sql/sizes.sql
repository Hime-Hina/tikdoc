select pg_size_pretty(pg_database_size('tikdoc'));
select pg_size_pretty(pg_total_relation_size('documents_pages_content_index'));
-- select pg_size_pretty(pg_indexes_size('documents_pages'));
select pg_size_pretty(pg_tablespace_size('pg_default'));

-- select indexrelname, pg_size_pretty(pg_relation_size(relid))
-- from pg_stat_user_indexes
-- where schemaname='public'
-- order by pg_relation_size(relid) desc;

-- select relname, pg_size_pretty(pg_total_relation_size(relid))
-- from pg_stat_user_tables
-- where schemaname='public'
-- order by pg_relation_size(relid) desc;