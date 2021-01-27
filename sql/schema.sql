CREATE TABLE public.ch_events
(
    "ID" serial NOT NULL,
    name character varying(150) NOT NULL,
    description character varying(500),
    moderators character varying(200),
    scheduled_for timestamp with time zone,
    link character varying(120) NOT NULL,
    created_on timestamp DEFAULT NOW(),
    PRIMARY KEY ("ID")
);
