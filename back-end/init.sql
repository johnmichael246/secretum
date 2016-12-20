-- Copyright 2016-2047 Danylo Vashchilenko

-- Licensed under the Apache License, Version 2.0 (the "License");
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at

--     http://www.apache.org/licenses/LICENSE-2.0

-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.

-- Current dump of database schema
-- TODO: Update column names and types

CREATE SEQUENCE secret_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

 CREATE TABLE secrets (
    id integer DEFAULT nextval('secret_id_seq'::regclass) NOT NULL,
    resource text NOT NULL,
    principal text NOT NULL,
    secret text NOT NULL,
    notes text,
    section integer
);

 CREATE SEQUENCE section_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

 CREATE TABLE sections (
    id integer DEFAULT nextval('section_id_seq'::regclass) NOT NULL,
    name text NOT NULL
);
