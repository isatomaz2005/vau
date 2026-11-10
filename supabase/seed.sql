-- Dados iniciais simulados para a demonstração.
-- Rode depois do schema.sql. Pode rodar de novo para "resetar" a demo.

delete from public.relatos;
delete from public.avisos;

insert into public.relatos (bairro, lat, lng, referencia, nivel, descricao, status, autor, ainda_assim, ja_baixou, criado_em) values
  ('jardim-pantanal', -23.4949, -46.4221, 'Rua Capachós, perto do córrego', 'intransitavel', 'Água acima do joelho, ônibus voltando', 'confirmado', 'seed', 7, 0, now() - interval '25 minutes'),
  ('jardim-pantanal', -23.4971, -46.4250, 'Av. Kumaki Aoki, em frente à escola', 'perigoso', 'Correnteza forte na esquina', 'novo', 'seed', 2, 0, now() - interval '12 minutes'),
  ('jardim-pantanal', -23.4936, -46.4269, 'Praça do Pantanal', 'passavel', 'Poça grande mas dá para passar pela calçada', 'novo', 'seed', 1, 1, now() - interval '6 minutes'),
  ('jardim-romano', -23.4918, -46.3921, 'Rua Pedro Romano, altura do mercado', 'perigoso', '', 'novo', 'seed', 3, 0, now() - interval '18 minutes'),
  ('itaim-paulista', -23.5021, -46.4002, 'Estação Itaim Paulista, saída norte', 'intransitavel', 'Túnel de pedestres alagado', 'confirmado', 'seed', 11, 0, now() - interval '40 minutes'),
  ('lapa-de-baixo', -23.5168, -46.7049, 'Rua Guaicurus com Rua Clélia', 'perigoso', 'Bueiro devolvendo água', 'novo', 'seed', 0, 0, now() - interval '3 minutes'),
  ('vila-prudente', -23.5840, -46.5810, 'Av. Prof. Luiz Ignácio Anhaia Mello, sentido centro', 'passavel', '', 'resolvido', 'seed', 4, 5, now() - interval '2 hours');

insert into public.avisos (bairro, nivel, mensagem, criado_em) values
  ('jardim-pantanal', 'alerta', 'Chuva forte até as 19h. Evite a Rua Capachós e a Av. Kumaki Aoki. Ponto de apoio na EMEF Pantanal.', now() - interval '20 minutes'),
  ('itaim-paulista', 'atencao', 'Túnel da estação fechado. Use a passarela da saída sul.', now() - interval '35 minutes');
