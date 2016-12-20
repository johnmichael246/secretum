<?php

// Copyright 2016-2017 Danylo Vashchilenko
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$dbconn = pg_connect("host=localhost dbname=db user=user1 password=pass1")
	or die('Could not connect: ' . pg_last_error());

if($_REQUEST['action'] == "sections_list") {
	$query = "select id, name from sections";
	$result = pg_query($query) or die('Query failed: ' . pg_last_error());
	$records = pg_fetch_all($result);
	if($records == FALSE) {
		$records = array();
	}
	echo json_encode(array('results' => $records));

	pg_free_result($result);
} elseif ($_REQUEST['action'] == "secrets_search") {
	$request = pg_escape_string($_GET['query']);
	if(!array_key_exists('section', $_GET) || $_GET['section'] == '') {
		$section = -1;
	} else {
		$section = $_GET['section'];
	}
	$query = "select sc.id as secret_id, resource, principal, secret, notes, st.id as section_id, st.name as section_name from secrets sc left join sections st ON sc.section = st.id where (lower(resource) like lower('%{$request}%') or lower(principal) like lower('%{$request}%') or lower(notes) like lower('%${request}%')) and (section = ${section} OR ${section} = -1) order by secret_id";
	$result = pg_query($query) or die('Query failed: ' . pg_last_error());
	$records = pg_fetch_all($result);
	if($records == FALSE) {
		$records = array();
	}
	$records = array_map("prepare_secret", $records);
	echo json_encode(array('results' => $records));

	pg_free_result($result);
} elseif ($_REQUEST['action'] == "secrets_create") {
	$update = array_intersect_key($_POST, array('resource' => '',
						'principal' => '',
						'secret' => '',
						 'notes' => '',
						 'section' => ''));
	pg_insert($dbconn, "secrets", $update);
} elseif ($_REQUEST['action'] == "secrets_update") {
	$id = $_POST['id'];
	echo($_POST['id']);
	$update = array_intersect_key($_POST, array('resource' => '',
						'principal' => '',
						'secret' => '',
						 'notes' => '',
						 'section' => ''));
	pg_update($dbconn, "secrets", $update, array('id' => $id));
} elseif ($_REQUEST['action'] == "secrets_delete") {
	$id = $_POST['id'];
	pg_delete($dbconn, "secrets", array('id' => $id));
} elseif ($_REQUEST['action'] == "test") {
	echo "{'result': true}";
}

pg_close($dbconn);

function prepare_secret($record) {
	$r = array(
		'id' => intval($record['secret_id']),
		'resource' => $record['resource'],
		'principal' => $record['principal'],
		'password' => $record['secret'],
		'note' => $record['notes'],
		'group-id' => intval($record['section_id']),
		'group-name' => $record['section_name']
	);
	return $r;
}

?>
