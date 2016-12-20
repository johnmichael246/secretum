# Copyright 2016-2017 Danylo Vashchilenko
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import sys
from PyQt5.QtGui import (QKeySequence, QIcon)
import requests
import requests.auth
import json
from PyQt5.QtCore import Qt, QVariant
from PyQt5.QtWidgets import (QApplication, QCheckBox, QGridLayout, QGroupBox,
        QHBoxLayout, QPushButton, QRadioButton, QTextEdit, QVBoxLayout,
        QWidget, QTableWidget, QLabel, QLineEdit, QHeaderView, QAbstractItemView, QMenu,
        QAction, QDialog, QMessageBox, QListWidget, QComboBox, QShortcut, QMainWindow)
from tkinter import Tk
import string
import random

class Service:
    def __init__(self, settings):
        self.session = requests.Session()
        self.settings = settings

    def sections_list(self):
        resp = self._get({'action': 'sections_list'})

        return json.loads(resp.text)['results']

    def query(self, resource, section):
        data = {'action': 'secrets_search', 'query': resource}
        if section is not None:
            data['section'] = section
        resp = self._get(data)

        return json.loads(resp.text)['results']

    def create(self, record):
        record['action'] = 'secrets_create'
        resp = self._post(record)

        if resp.status_code != 200:
            raise Exception()

    def update(self, record):
        record['action'] = 'secrets_update'
        resp = self._post(record)

        if resp.status_code != 200:
            raise Exception()

    def delete(self, record_id):
        data = {'action': 'secrets_delete', 'id': record_id}
        resp = self._post(data)

        if resp.status_code != 200:
            raise Exception()

    def test(self):
        resp = self._get({'action': 'test'})
        result = {
            'ok': resp.status_code == 200,
            'code': resp.status_code,
            'message': resp.reason
        }

        return result

    def _get(self, params):
        resp = self.session.get(self.settings['url'],
                                params=params,
                                auth=requests.auth.HTTPBasicAuth(self.settings['username'],
                                                                 self.settings['password']))
        print("GET %s" % resp.url)
        # print("LOADED %s" % resp.text)
        return resp

    def _post(self, payload):
        params = {}
        resp = self.session.post(self.settings['url'],
                                 data=payload,
                                 params=params,
                                 auth=requests.auth.HTTPBasicAuth(self.settings['username'],
                                                                  self.settings['password']))
        print("POST %s" % resp.url)
        return resp


class SecretEditor(QDialog):

    def __init__(self, service, record, parent=None):
        super(SecretEditor, self).__init__(parent)

        self.service = service
        self.inputRecord = record
        self.resultRecord = {}

        mainLayout = QVBoxLayout()
        lineLayout = QHBoxLayout()

        self.idEdit = QLineEdit("%s" % record['id'], self)
        self.idEdit.setReadOnly(True)
        self.idEdit.setEnabled(False)
        lineLayout.addWidget(self._label("ID:"))
        lineLayout.addWidget(self.idEdit)

        mainLayout.addLayout(lineLayout)
        lineLayout = QHBoxLayout()

        self.sections_box = QComboBox()
        self.sections_box.setFocus(Qt.OtherFocusReason)
        for section in self.service.sections_list():
            self.sections_box.addItem(section['name'], QVariant(section))
        if record['section'] is not None:
            self.sections_box.setCurrentText(record['section']['name'])
        lineLayout.addWidget(self._label('Section:'))
        lineLayout.addWidget(self.sections_box)

        mainLayout.addLayout(lineLayout)
        lineLayout = QHBoxLayout()

        self.resourceEdit = QLineEdit(record['resource'], self)
        lineLayout.addWidget(self._label("Resource:"))
        lineLayout.addWidget(self.resourceEdit)

        mainLayout.addLayout(lineLayout)
        lineLayout = QHBoxLayout()

        self.principalEdit = QLineEdit(record['principal'], self)
        lineLayout.addWidget(self._label("Principal:"))
        lineLayout.addWidget(self.principalEdit)

        mainLayout.addLayout(lineLayout)
        lineLayout = QHBoxLayout()

        if record['secret'] == '':
            record['secret'] = self._password()
        self.secretEdit = QLineEdit(record['secret'], self)
        lineLayout.addWidget(self._label("Secret:"))
        lineLayout.addWidget(self.secretEdit)

        mainLayout.addLayout(lineLayout)
        lineLayout = QHBoxLayout()

        self.notesEdit = QTextEdit(record['notes'], self)
        self.notesEdit.setAcceptRichText(False)
        self.notesEdit.setTabChangesFocus(True)
        lineLayout.addWidget(self._label("Notes:"))
        lineLayout.addWidget(self.notesEdit)

        mainLayout.addLayout(lineLayout)
        lineLayout = QHBoxLayout()

        button = QPushButton("Save")
        button.clicked.connect(self.save)
        lineLayout.addWidget(button)
        button = QPushButton("Cancel")
        button.clicked.connect(self.cancel)
        lineLayout.addWidget(button)

        mainLayout.addLayout(lineLayout)

        self.setLayout(mainLayout)
        self.setWindowTitle("Edit")

    def _password(self, size=20, chars=string.ascii_uppercase + string.digits + string.ascii_lowercase + "!@#$%^&*()_+"):
        return ''.join(random.choice(chars) for _ in range(size))

    def _label(self, text):
        label = QLabel(text)
        label.setAlignment(Qt.AlignRight | Qt.AlignVCenter)
        label.setFixedWidth(50)
        return label


    def save(self):
        reply = QMessageBox.question(None, "Save", "Are you sure?", QMessageBox.Yes, QMessageBox.No)

        if reply == QMessageBox.No:
            return

        self.resultRecord = {
            'resource': self.resourceEdit.text(),
            'principal': self.principalEdit.text(),
            'secret': self.secretEdit.text(),
            'notes': self.notesEdit.toPlainText(),
            'section': self.sections_box.currentData()['id'],
        }

        if self.inputRecord['id'] is not None:
            self.resultRecord['id'] = self.inputRecord['id']

        self.close()

    def cancel(self):
        self.close()

    def record(self):
        return self.resultRecord


class LoginDialog(QDialog):
    def __init__(self, parent=None):
        super(LoginDialog, self).__init__(parent)
        self._result = None

        defaults = {
            'url': 'https://secretum.io/service.php',
            'db': 'secretum',
            'username': 'secretum',
            'password': '',
        }
        main_layout = QVBoxLayout()

        line_layout = QHBoxLayout()
        line_layout.addWidget(QLabel("URL:"))
        self.url_edit = QLineEdit(defaults['url'])
        line_layout.addWidget(self.url_edit)
        main_layout.addLayout(line_layout)

        line_layout = QHBoxLayout()
        line_layout.addWidget(QLabel("Database:"))
        self.database_edit = QLineEdit(defaults['db'])
        line_layout.addWidget(self.database_edit)
        main_layout.addLayout(line_layout)

        line_layout = QHBoxLayout()
        line_layout.addWidget(QLabel("Username:"))
        self.username_edit = QLineEdit(defaults['username'])
        line_layout.addWidget(self.username_edit)
        main_layout.addLayout(line_layout)

        line_layout = QHBoxLayout()
        line_layout.addWidget(QLabel("Password:"))
        self.password_edit = QLineEdit(defaults['password'])
        self.password_edit.setEchoMode(QLineEdit.Password)
        line_layout.addWidget(self.password_edit)
        main_layout.addLayout(line_layout)

        line_layout = QHBoxLayout()
        login_button = QPushButton("Login")
        login_button.clicked.connect(self.login)
        login_button.setDefault(True)
        line_layout.addWidget(login_button)
        button = QPushButton("Exit")
        button.clicked.connect(self.close)
        line_layout.addWidget(button)
        main_layout.addLayout(line_layout)

        self.setLayout(main_layout)
        self.setFixedSize(400, 200)
        self.setWindowTitle("Secretum - Login")

        self.password_edit.setFocus(Qt.OtherFocusReason)

    def login(self):
        self._result = {
            'url': self.url_edit.text(),
            'db': self.database_edit.text(),
            'username': self.username_edit.text(),
            'password': self.password_edit.text(),
        }

        service = Service(self._result)
        test = service.test()
        if not test['ok']:
            QMessageBox.information(None, None, "Error",
                                    "Connection failed with code %d (%s)" % (test['code'], test['message']))
            return

        self.accept()

    def result(self):
        return self._result


class MainWindow(QMainWindow):
    def __init__(self):
        super(MainWindow, self).__init__(None)

        self.service = None
        self.records = None

        self.sections_box = QComboBox()
        self.sections_box.addItem("Any section", None)
        self.sections_box.currentIndexChanged.connect(self.query)

        shortcut = QShortcut(QKeySequence("Alt+Q"), self)
        shortcut.activated.connect(self.activate_section)

        self.query_edit = QLineEdit()
        self.query_edit.returnPressed.connect(self.query)
        query_button = QPushButton("Query!")
        query_button.clicked.connect(self.query)

        shortcut = QShortcut(QKeySequence("Alt+W"), self)
        shortcut.activated.connect(self.activate_query)

        query_layout = QHBoxLayout()
        query_layout.addWidget(self.sections_box)
        query_layout.addWidget(self.query_edit)
        query_layout.addWidget(query_button)

        self.responseTable = QTableWidget()
        self.responseTable.setSelectionMode(QAbstractItemView.SingleSelection)
        self.responseTable.setSelectionBehavior(QAbstractItemView.SelectRows)

        action = QAction("Edit", self)
        action.triggered.connect(self.edit)
        self.responseTable.addAction(action)
        action = QAction("Delete", self)
        action.triggered.connect(self.delete)
        self.responseTable.addAction(action)
        self.responseTable.setContextMenuPolicy(Qt.ActionsContextMenu)

        self.responseTable.setColumnCount(3)
        self.responseTable.setHorizontalHeaderLabels(['Resource', 'Principal', 'Notes'])
        for i in range(3):
            self.responseTable.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)

        shortcut = QShortcut(QKeySequence("Alt+E"), self)
        shortcut.activated.connect(self.activate_secrets)

        shortcut = QShortcut(QKeySequence("Alt+R"), self)
        shortcut.activated.connect(self.copy)

        actionsLayout = QHBoxLayout()

        addButton = QPushButton("Add")
        addButton.clicked.connect(self.new)
        shortcut = QShortcut(QKeySequence("Alt+A"), self)
        shortcut.activated.connect(self.new)

        copyButton = QPushButton("Copy")
        copyButton.clicked.connect(self.copy)

        actionsLayout.addWidget(addButton)
        actionsLayout.addWidget(copyButton)

        shortcut = QShortcut(QKeySequence("Alt+D"), self)
        shortcut.activated.connect(self.delete)

        layout = QVBoxLayout()
        layout.addLayout(query_layout)
        layout.addWidget(self.responseTable)
        layout.addLayout(actionsLayout)

        widget = QWidget()
        widget.setLayout(layout)
        self.setCentralWidget(widget)

        self.setFixedSize(600, 400)
        self.setWindowTitle("Secretum")

    def show(self):
        super(QMainWindow, self).show()

        login = LoginDialog(self)
        login.accepted.connect(self._login_accepted(login))
        login.rejected.connect(self._login_rejected)
        login.exec()

    def _login_accepted(self, login):
        def handler():
            self.service = Service(login.result())
            self._load_sections()
            self.query()

        return handler

    def _login_rejected(self):
        self.close()

    def _load_sections(self):
        for section in self.service.sections_list():
            self.sections_box.addItem(section['name'], QVariant(section))
        self.sections_box.setCurrentIndex(0)

    def query(self):
        section = None
        if self.sections_box.currentData() is not None:
            section = self.sections_box.currentData()['id']
        self.records = self.service.query(self.query_edit.text(), section)
        self.responseTable.setRowCount(len(self.records))

        for i in range(len(self.records)):
            record = self.records[i]
            self.responseTable.setCellWidget(i, 0, QLabel(record['resource']))
            self.responseTable.setCellWidget(i, 1, QLabel(record['principal']))
            self.responseTable.setCellWidget(i, 2, QLabel(record['notes']))

    def copy(self):
        index = self.responseTable.currentIndex().row()
        if index == -1:
            return

        record = self.records[index]

        r = Tk()
        r.withdraw()
        r.clipboard_clear()
        r.clipboard_append(record['secret'])
        r.destroy()

    def new(self):
        record = {'id': None, 'resource': '', 'principal': '', 'secret': '', 'notes': '', 'section': None}
        print("CREATE %s" % record)

        dialog = SecretEditor(self.service, record, self)
        dialog.exec()
        record = dialog.record()

        self.service.create(record)
        self.query()

    def edit(self):
        record = self.records[self.responseTable.selectedIndexes()[0].row()]
        print("EDIT %s" % record)

        dialog = SecretEditor(self.service, record, self)
        dialog.exec()
        record = dialog.record()

        self.service.update(record)
        self.query()

    def delete(self):
        reply = QMessageBox.question(None, "Delete", "Are you sure you want to delete?", QMessageBox.Yes, QMessageBox.No)

        if reply == QMessageBox.No:
            return

        record = self.records[self.responseTable.selectedIndexes()[0].row()]
        print("DELETE %s" % record)
        self.service.delete(record['id'])

        self.query()

    def activate_section(self):
        self.sections_box.setFocus(Qt.ShortcutFocusReason)
        self.sections_box.showPopup()

    def activate_query(self):
        self.query_edit.setFocus(Qt.ShortcutFocusReason)
        self.query_edit.setSelection(0, len(self.query_edit.text()))

    def activate_secrets(self):
        self.responseTable.setFocus(Qt.ShortcutFocusReason)
        self.responseTable.selectRow(0)
        #self.responseTable.selectColumn(0)
        #self.responseTable.setCurrentCell(0, 3)


app = QApplication(sys.argv)

w = MainWindow()
w.setWindowIcon(QIcon('lock.png'))
w.show()

sys.exit(app.exec_())

