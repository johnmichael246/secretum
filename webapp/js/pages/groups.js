import { ep, epc} from '../ui.js';
import { GroupsTable } from '../components/groups-table.js';
import { GroupEditorDialog } from '../dialogs/group-editor.js';
import { Button } from '../components/button.js';
import { SearchTool } from '../components/search-tool.js';
import { ConfirmDialog } from '../dialogs/confirm.js';
import { GroupForm } from '../components/group-form.js';

export class GroupPage extends React.Component {
  constructor(props, context) {
    super(props);
    this.context = context;
    this.state = {groups: this.context.store.findGroups()};
    this._onNew = this._onNew.bind(this);
    this._onSearch = this._onSearch.bind(this);
    this._onEdit = this._onEdit.bind(this);
    this._onRemove = this._onRemove.bind(this);
  }

  _onEdit(group) {
    const props = {
      groupId: group.id,
      onSubmit: (group) => {
        this.context.app.hideModal();
        this.context.store.saveGroup(group).then(() => {
          this.setState({groups: this.context.store.findGroups(this.state.query)});
        });
      },
      onCancel: () => this.context.app.hideModal()
    };
    this.context.app.showModal(GroupEditorDialog, props);
  }
  
 _onNew() {
    const props = {
      groupId: null,
      title: 'New Group',
      onSubmit: (group) => {
        this.context.app.hideModal();
        this.context.store.createGroup(group).then(() => {
          this.setState({groups: this.context.store.findGroups(this.state.query)});
        });
      },
      onCancel: () => this.context.app.hideModal()
    };
    this.context.app.showModal(GroupEditorDialog, props);
 }

  _onRemove(group) {
    this.context.app.showModal(ConfirmDialog, {
      content: [
        epc('div', {key: 'question'}, 'Are you sure you would like to remove this group?'),
        ep(GroupForm, {
          key: 'group',
          readOnly: true,
          groupId: group.id,
          fields: ['id', 'name']
        })
      ],
      onYes: ()=> {
        this.context.store.removeGroup(group.id)
          .then(() => this.setState({
            groups: this.context.store.findGroups()
          }));
        this.context.app.hideModal();
      },
      onNo: () => this.context.app.hideModal()
    });
  }

  _onSearch(query) {
    var a = {};//toDo
    var promise = Promise.resolve("works");
    var groups = this.context.store.findGroupsByQuery(query);
    this.setState({query: query, groups: groups});
  }
  
  render() {
    const handlers = {onEdit: this._onEdit, onRemove: this._onRemove};
    return epc("div", {className: "page home"}, [
      ep(GroupsTable, {key: "table", groups: this.state.groups, actionHandlers: handlers}),
      ep(Button, {key: "!new", handler: this._onNew, label: "New Group", icon: 'plus-square'}),
      ep(SearchTool, {key: "search", onSubmit: this._onSearch, groups: this.context.store.findGroups()})
    ]);
  }
}

GroupPage.contextTypes = {
  app: React.PropTypes.object,
  store: React.PropTypes.object
};
