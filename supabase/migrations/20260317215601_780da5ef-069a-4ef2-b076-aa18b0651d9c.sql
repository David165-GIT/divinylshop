-- Table for vinyl records catalogue
CREATE TABLE public.records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  genre TEXT,
  price NUMERIC(10,2),
  condition TEXT,
  description TEXT,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'vinyl' CHECK (category IN ('vinyl', 'hifi')),
  is_sold BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;

-- Everyone can view records
CREATE POLICY "Records are viewable by everyone"
  ON public.records FOR SELECT
  USING (true);

-- Only authenticated users (admin) can insert/update/delete
CREATE POLICY "Authenticated users can insert records"
  ON public.records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update records"
  ON public.records FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete records"
  ON public.records FOR DELETE
  TO authenticated
  USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_records_updated_at
  BEFORE UPDATE ON public.records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for record images
INSERT INTO storage.buckets (id, name, public) VALUES ('record-images', 'record-images', true);

CREATE POLICY "Record images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'record-images');

CREATE POLICY "Authenticated users can upload record images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'record-images');

CREATE POLICY "Authenticated users can update record images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'record-images');

CREATE POLICY "Authenticated users can delete record images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'record-images');