ALTER TABLE public.builds
ADD CONSTRAINT title_length CHECK (char_length(title) BETWEEN 3 AND 100);

ALTER TABLE public.tags
ADD CONSTRAINT tag_length CHECK (char_length(name) BETWEEN 1 AND 50);

ALTER TABLE public.tags
ADD CONSTRAINT tag_format CHECK (name ~ '^[A-Za-z0-9 -]+$');
