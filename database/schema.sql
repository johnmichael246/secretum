-- Copyright 2016-2017 Danylo Vashchilenko
--
-- Licensed under the Apache License, Version 2.0 (the "License");
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at
--
--     http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.

CREATE SEQUENCE vault_id_seq;

CREATE TABLE public.vaults
(
    id integer NOT NULL DEFAULT nextval('vault_id_seq'::regclass),
    name text NOT NULL,
    CONSTRAINT vaults_id_pk PRIMARY KEY (id)
);

CREATE SEQUENCE snapshot_id_seq;

CREATE TABLE public.snapshots
(
    id integer NOT NULL DEFAULT nextval('snapshot_id_seq'::regclass),
    parent integer,
    posted timestamp without time zone NOT NULL DEFAULT now(),
    device text NOT NULL,
    delta text NOT NULL,
    vault integer NOT NULL,
    CONSTRAINT snapshot_id_pk PRIMARY KEY (id),
    CONSTRAINT snapshot_parent_fk FOREIGN KEY (parent)
        REFERENCES public.snapshots (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT snapshot_vault_fk FOREIGN KEY (vault)
        REFERENCES public.vaults (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);
