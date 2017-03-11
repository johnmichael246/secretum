import {ep} from '../ui.js';
import {DataForm} from './data-form.js';

export class GroupForm extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		const groups = this.context.store.findGroups().then(gs => gs.map(g => ({value: g.id, label: g.name})));
		const readOnly = this.props.readOnly || false;


		const fields = [
			{name: "id", type: "text", label: "ID", readOnly: true},
			{name: "name", type: "textarea", label: "Group", readOnly: readOnly}
		].filter(field => this.props.fields === undefined || this.props.fields.includes(field.name));

		const actions = this.props.topActions||[];

		const group = this.props.groupId === null ? {
			id: '',
			name: ''
		} : this.context.store.getGroup(this.props.groupId);

		const form = {
			className: this.props.className||'' + ' secret-form',
			title: this.props.title,
			fields: fields,
			data: group,
			onSubmit: this.props.onSubmit,
			onCancel: this.props.onCancel,
			topActions: actions
		};
		return ep(DataForm, form);
	}
}

GroupForm.contextTypes = {
  store: React.PropTypes.object
};
