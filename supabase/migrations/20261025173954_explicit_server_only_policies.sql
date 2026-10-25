CREATE POLICY server_only ON public.kb_shops FOR ALL TO anon,authenticated USING(false) WITH CHECK(false);
CREATE POLICY server_only ON public.kb_products FOR ALL TO anon,authenticated USING(false) WITH CHECK(false);
CREATE POLICY server_only ON public.kb_members FOR ALL TO anon,authenticated USING(false) WITH CHECK(false);
CREATE POLICY server_only ON public.kb_roles FOR ALL TO anon,authenticated USING(false) WITH CHECK(false);
CREATE POLICY server_only ON public.kb_consultations FOR ALL TO anon,authenticated USING(false) WITH CHECK(false);
CREATE POLICY server_only ON public.kb_visits FOR ALL TO anon,authenticated USING(false) WITH CHECK(false);
CREATE POLICY server_only ON public.kb_limits FOR ALL TO anon,authenticated USING(false) WITH CHECK(false);
