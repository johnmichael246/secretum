import { GroupForm } from '../components/group-form.js';
import { ep, epc } from '../ui.js';

export class GroupEditorDialog  extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const children = [
      epc('div', {key: 'title', className: 'dialog-title'}, this.props.title||'Group Editor'),
      epc('div', {key: 'content', className: 'dialog-content'},
        ep(GroupForm, {
          key: 'form',
          groupId: this.props.groupId,
          onSubmit: this.props.onSubmit,
          onCancel: this.props.onCancel
        })
      )
    ];
    return epc('div', {className: 'dialog'}, children);
  }
}

GroupEditorDialog.contextTypes = {
  app: React.PropTypes.object,
  store: React.PropTypes.object
}
