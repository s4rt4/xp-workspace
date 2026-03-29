<?php
class WikiPage extends Model
{
    protected string $table = 'wiki_pages';
    protected array $fillable = ['parent_id', 'title', 'slug', 'content', 'icon', 'is_pinned', 'sort_order'];
}
