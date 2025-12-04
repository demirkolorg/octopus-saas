'use client';

import { useState } from 'react';
import { Article } from '@/lib/api/articles';
import { formatFullDate } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ExternalLink,
  X,
  Check,
  Eye,
  EyeOff,
  Calendar,
  Globe,
  ChevronUp,
  ChevronDown,
  Newspaper,
  Clock,
  Users,
  BookOpen,
  Star,
  Tag,
  Plus,
  Loader2,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  MessageCircle,
  Link,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFavoriteCheck, useToggleFavorite } from '@/hooks/use-favorites';
import { useTags, useArticleTags, useAddTagToArticle, useRemoveTagFromArticle, useCreateTag } from '@/hooks/use-tags';

interface ArticleDetailPanelProps {
  article: Article | null;
  onClose: () => void;
  onMarkAsRead?: (id: string) => void;
  onMarkAsUnread?: (id: string) => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function ArticleDetailPanel({
  article,
  onClose,
  onMarkAsRead,
  onMarkAsUnread,
  onNavigatePrev,
  onNavigateNext,
  hasPrev = false,
  hasNext = false,
}: ArticleDetailPanelProps) {
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [sharePopoverOpen, setSharePopoverOpen] = useState(false);

  // Hooks - always called at top level
  const articleId = article?.id || '';
  const { data: favoriteData, isLoading: isFavoriteLoading } = useFavoriteCheck(articleId);
  const isFavorite = favoriteData?.isFavorite ?? false;
  const toggleFavorite = useToggleFavorite();
  const { data: allTags = [] } = useTags();
  const { data: articleTags = [] } = useArticleTags(articleId);
  const addTagToArticle = useAddTagToArticle();
  const removeTagFromArticle = useRemoveTagFromArticle();
  const createTag = useCreateTag();

  if (!article) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground border-l bg-gradient-to-br from-muted/30 to-muted/10">
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Newspaper className="h-10 w-10 opacity-40" />
          </div>
          <p className="text-lg font-medium mb-1">Haber Seçilmedi</p>
          <p className="text-sm opacity-70">Detayları görmek için listeden bir haber seçin</p>
        </div>
      </div>
    );
  }

  const handleReadToggle = () => {
    if (article.isRead) {
      onMarkAsUnread?.(article.id);
    } else {
      onMarkAsRead?.(article.id);
    }
  };

  const handleFavoriteToggle = () => {
    toggleFavorite.mutate({
      articleId: article.id,
      isFavorite: !!isFavorite,
    });
  };

  const handleAddTag = (tagId: string) => {
    addTagToArticle.mutate({ tagId, articleId: article.id });
  };

  const handleRemoveTag = (tagId: string) => {
    removeTagFromArticle.mutate({ tagId, articleId: article.id });
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const newTag = await createTag.mutateAsync({ name: newTagName.trim() });
      if (newTag?.id) {
        addTagToArticle.mutate({ tagId: newTag.id, articleId: article.id });
      }
      setNewTagName('');
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const isTagAssigned = (tagId: string) => articleTags.some((t) => t.id === tagId);

  // Share functions
  const shareUrl = article?.url || '';
  const shareTitle = article?.title || '';

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
    setSharePopoverOpen(false);
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
    setSharePopoverOpen(false);
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
    setSharePopoverOpen(false);
  };

  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`;
    window.open(url, '_blank');
    setSharePopoverOpen(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link kopyalandı!');
      setSharePopoverOpen(false);
    } catch (error) {
      toast.error('Link kopyalanamadı');
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          url: shareUrl,
        });
        setSharePopoverOpen(false);
      } catch (error) {
        // User cancelled or error
      }
    }
  };

  const getSourceLogo = (source: { site?: { logoUrl?: string; domain?: string; name?: string }; name: string }) => {
    const logoUrl = source.site?.logoUrl;
    const domain = source.site?.domain;
    const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null;
    return logoUrl || faviconUrl;
  };

  return (
    <div className="h-full flex flex-col border-l bg-background">
      {/* Floating Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onNavigatePrev}
            disabled={!hasPrev}
            title="Önceki haber"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onNavigateNext}
            disabled={!hasNext}
            title="Sonraki haber"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-0.5">
          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-full ${isFavorite ? 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50' : 'hover:text-yellow-500 hover:bg-yellow-50'}`}
            onClick={handleFavoriteToggle}
            disabled={isFavoriteLoading || toggleFavorite.isPending}
            title={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          >
            {toggleFavorite.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-500' : ''}`} />
            )}
          </Button>

          {/* Tag Popover */}
          <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-full ${articleTags.length > 0 ? 'text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50' : 'hover:text-indigo-500 hover:bg-indigo-50'}`}
                title="Etiketler"
              >
                <Tag className="h-4 w-4" />
                {articleTags.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-indigo-500 text-[10px] text-white flex items-center justify-center">
                    {articleTags.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
              <div className="space-y-2">
                <p className="text-sm font-medium px-1">Etiketler</p>

                {/* Existing tags */}
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {allTags.map((tag) => {
                    const isAssigned = isTagAssigned(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => isAssigned ? handleRemoveTag(tag.id) : handleAddTag(tag.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                          isAssigned
                            ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="flex-1 text-left truncate">{tag.name}</span>
                        {isAssigned && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                      </button>
                    );
                  })}
                  {allTags.length === 0 && (
                    <p className="text-xs text-muted-foreground px-2 py-1">
                      Henüz etiket yok
                    </p>
                  )}
                </div>

                <Separator />

                {/* Create new tag */}
                <div className="flex gap-1">
                  <Input
                    placeholder="Yeni etiket..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                    className="h-8 text-sm"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim() || createTag.isPending}
                  >
                    {createTag.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Share Popover */}
          <Popover open={sharePopoverOpen} onOpenChange={setSharePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:text-green-600 hover:bg-green-50"
                title="Paylaş"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <div className="space-y-1">
                <p className="text-sm font-medium px-2 pb-1">Paylaş</p>

                <button
                  onClick={shareToTwitter}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm hover:bg-muted transition-colors"
                >
                  <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                  <span>Twitter</span>
                </button>

                <button
                  onClick={shareToFacebook}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm hover:bg-muted transition-colors"
                >
                  <Facebook className="h-4 w-4 text-[#1877F2]" />
                  <span>Facebook</span>
                </button>

                <button
                  onClick={shareToLinkedIn}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm hover:bg-muted transition-colors"
                >
                  <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                  <span>LinkedIn</span>
                </button>

                <button
                  onClick={shareToWhatsApp}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm hover:bg-muted transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-[#25D366]" />
                  <span>WhatsApp</span>
                </button>

                <Separator className="my-1" />

                <button
                  onClick={copyToClipboard}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm hover:bg-muted transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  <span>Linki Kopyala</span>
                </button>

                {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                  <button
                    onClick={nativeShare}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm hover:bg-muted transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Diğer...</span>
                  </button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-4 mx-1" />

          <Button
            variant={article.isRead ? "ghost" : "ghost"}
            size="icon"
            className={`h-8 w-8 rounded-full ${!article.isRead ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : ''}`}
            onClick={handleReadToggle}
            title={article.isRead ? 'Okunmadı olarak işaretle' : 'Okundu olarak işaretle'}
          >
            {article.isRead ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => window.open(article.url, '_blank')}
            title="Kaynağa git"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-4 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onClose}
            title="Kapat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        {/* Hero Image with Title Overlay */}
        {article.imageUrl ? (
          <div className="relative w-full max-h-[450px] bg-muted overflow-hidden">
            <img
              src={article.imageUrl}
              alt=""
              className="w-full h-[450px] object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
              }}
            />

            {/* Bottom overlay with blur */}
            <div className="absolute inset-x-0 bottom-0 bg-black/40 backdrop-blur-md">
              <div className="p-4 space-y-2">
                {/* Title */}
                <h2 className="text-3xl font-bold leading-tight tracking-tight text-white">
                  {article.title}
                </h2>

                {/* Meta Row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
                  {/* Source */}
                  {article.source?.site && (
                    <div className="flex items-center gap-1.5">
                      {getSourceLogo(article.source) ? (
                        <img
                          src={getSourceLogo(article.source)!}
                          alt=""
                          className="h-4 w-4 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Globe className="h-4 w-4" />
                      )}
                      <span className="font-medium">
                        {article.source.site?.name || article.source.name}
                      </span>
                    </div>
                  )}

                  <span className="text-white/40">|</span>

                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatFullDate(article.publishedAt)}</span>
                  </div>

                  {article.sourceCount > 1 && (
                    <>
                      <span className="text-white/40">|</span>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span>{article.sourceCount} kaynak</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Article Tags */}
                {articleTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {articleTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="text-xs px-2 py-0.5 bg-white/20 hover:bg-white/30 text-white border-0"
                        style={{ borderLeft: `3px solid ${tag.color}` }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Watch Matches */}
                {article.watchMatches && article.watchMatches.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {article.watchMatches.map((match) => (
                      <Badge
                        key={match.id}
                        style={{ backgroundColor: match.watchKeyword.color }}
                        className="text-white text-xs px-2 py-0.5"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {match.watchKeyword.keyword}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* No image - show title normally */
          <div className="p-4 space-y-3 border-b">
            <h2 className="text-xl font-bold leading-tight tracking-tight">
              {article.title}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {article.source?.site && (
                <div className="flex items-center gap-1.5">
                  {getSourceLogo(article.source) ? (
                    <img
                      src={getSourceLogo(article.source)!}
                      alt=""
                      className="h-4 w-4 rounded-full object-cover"
                    />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                  <span className="font-medium">
                    {article.source.site?.name || article.source.name}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{formatFullDate(article.publishedAt)}</span>
              </div>
              {article.sourceCount > 1 && (
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>{article.sourceCount} kaynak</span>
                </div>
              )}
            </div>

            {/* Article Tags */}
            {articleTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {articleTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-xs px-2 py-0.5"
                    style={{ borderLeft: `3px solid ${tag.color}` }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Watch Matches */}
            {article.watchMatches && article.watchMatches.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {article.watchMatches.map((match) => (
                  <Badge
                    key={match.id}
                    style={{ backgroundColor: match.watchKeyword.color }}
                    className="text-white text-xs px-2 py-0.5"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    {match.watchKeyword.keyword}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-4 space-y-4">
          {/* Summary/Content */}
          {article.content && (
            <article className="space-y-6">
              {(() => {
                const content = article.content;

                // First try splitting by newlines
                let paragraphs = content.split(/\n\n+/).filter((p) => p.trim());

                // If only one paragraph, try single newlines
                if (paragraphs.length === 1) {
                  const singleSplit = content.split(/\n/).filter((p) => p.trim());
                  if (singleSplit.length > 1) {
                    paragraphs = singleSplit;
                  }
                }

                // If still one long paragraph, split by sentences
                if (paragraphs.length === 1 && paragraphs[0].length > 300) {
                  // Split by sentence endings, keeping the punctuation
                  const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];

                  // Group sentences into paragraphs (3 sentences each)
                  const sentencesPerParagraph = 3;
                  paragraphs = [];

                  for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
                    const group = sentences.slice(i, i + sentencesPerParagraph);
                    paragraphs.push(group.join(' ').trim());
                  }
                }

                return paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-[15px] leading-[1.85] text-foreground/90 text-justify hyphens-auto indent-8"
                  >
                    {paragraph.trim()}
                  </p>
                ));
              })()}
            </article>
          )}

          {/* Read Full Article Button */}
          <Button
            className="w-full gap-2 h-11 text-base font-medium"
            onClick={() => window.open(article.url, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            Haberin Tamamını Oku
          </Button>

          {/* All sources list */}
          {article.relatedSources && article.relatedSources.length > 1 && (
            <div className="pt-2">
              <Separator className="mb-4" />
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Bu Haberi Paylaşan Kaynaklar</h4>
              </div>
              <div className="grid gap-2">
                {article.relatedSources.map((source) => {
                  const logoUrl = getSourceLogo(source);
                  return (
                    <a
                      key={source.id}
                      href={source.articleUrl || article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 hover:border-accent transition-all group"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <Globe className={`h-5 w-5 text-muted-foreground ${logoUrl ? 'hidden' : ''}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                          {source.site?.name || source.name}
                        </p>
                        {source.category && (
                          <p className="text-xs text-muted-foreground truncate">
                            {source.category.name}
                          </p>
                        )}
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
