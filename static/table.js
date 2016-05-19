/* eslint-env browser */

const moment = require('moment');
const React = require('react');
const ReactDOM = require('react-dom');
const url = require('url');
const $ = require('jquery');

var pathname = window.location.pathname;

var Repository = React.createClass({
  render: function() {
    if (!this.props.repository.lastCommit) {
      return (
        <tr>
          <td>
            <span class="text-muted">{this.props.repository.url.host}/</span><a href={this.props.repository.url.complete}><b>{this.props.repository.url.path.slice(1)}</b></a>
          </td>
          <td colSpan="4">
            Loading...
          </td>
        </tr>
      )
    }
    return (
      <tr>
        <td>
          <span class="text-muted">{this.props.repository.url.host}/</span><a href={this.props.repository.url.complete}><b>{this.props.repository.url.path.slice(1)}</b></a>
        </td>
        <td>
          {moment(this.props.repository.lastCommit.createdAt).fromNow()} <br/>
          ({this.props.repository.lastCommit.createdAt})
        </td>
        <td> {this.props.repository.lastCommit.message} </td>
        <td>
          {this.props.repository.lastCommit.authorName} <br/>
          &lt;{this.props.repository.lastCommit.authorEmail}&gt;
        </td>
        <td>
          <a href="#" onClick={this.props.onRemove}>
            <span className="sr-only">Remove</span>
            <span className="glyphicon glyphicon-remove-circle"></span>
          </a>
        </td>
      </tr>
    );
  }
});

var RepositoryForm = React.createClass({
  getInitialState: function() {
    return {url: ''};
  },
  handleUrlChange: function(e) {
    this.setState({url: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var repoUrl = this.state.url;
    var key = this.props.onNewRepo({
      url: {
        complete: repoUrl,
        host: url.parse(repoUrl).host,
        path: url.parse(repoUrl).pathname
      }
    });
    $.ajax({
      method: 'POST',
      url: '/list' + pathname + '/repository',
      data: JSON.stringify({url: repoUrl}),
      success: data => {
        this.props.onNewRepo(data, key);
      },
      error: function(xhr, status, err) {
        console.error('POST', '/list' + pathname + '/repository', err.toString());
      },
      dataType: 'json',
      contentType: 'application/json'
    });
    this.setState({url: ''});
  },
  render: function() {
    return (
      <form className="repoForm form-horizontal" onSubmit={this.handleSubmit}>
        <div className="form-group">
          <label className="sr-only" for="repoUrl">
            Github or Gitlab project URL
          </label>
          <div className="input-group input-group-lg">
            <input type="url"
              className="form-control"
              id="repoUrl"
              placeholder="Github or Gitlab project URL"
              value={this.state.url}
              onChange={this.handleUrlChange} />
            <span className="input-group-btn">
              <input type="submit" value="Add" className="btn btn-primary" />
            </span>
          </div>
        </div>
      </form>
    );
  }
});

var RepositoryTable = React.createClass({
  getInitialState: function() {
    return {data: [], loading: true};
  },
  componentDidMount: function() {
    $.ajax({
      url: '/list' + pathname + '/repositories',
      dataType: 'json',
      success: data => {
        this.setState({data: data, loading: false});
      },
      error: function(xhr, status, err) {
        console.error('GET', '/list' + pathname + '/repositories', err.toString());
      }
    });
  },
  handleNewRepo: function(repo, key) {
    var data = this.state.data;
    if (typeof key === 'undefined') {
      data.push(repo);
    } else {
      data[key] = repo;
    }
    this.setState({data: data, loading: false});

    return data.length - 1;
  },
  handleRemoveRepo: function(key) {
    $.ajax({
      method: 'DELETE',
      url: '/list' + pathname + '/repository/' + key,
      data: JSON.stringify({url: this.state.url}),
      error: (xhr, status, err) => {
        console.error('DELETE', '/list' + pathname + '/repository/' + key,
          status, err.toString());
      },
      dataType: 'json',
      contentType: 'application/json'
    });
    var data = this.state.data;
    data.splice(key, 1);
    this.setState({data: data, loading: false});
  },
  render: function() {
    var tableLines;

    if (this.state.data.length > 0) {
      tableLines = this.state.data.map((repo, key) => {
        var onRemove = () => {
          this.handleRemoveRepo(key);
        };

        return (
          <Repository key={key} repository={repo}
            onRemove={onRemove} />
        );
      });
    } else {
      tableLines = (
        <tr>
          <td colSpan="5" className="text-center">
            {this.state.loading ? 'Loading...' : 'No repository. Use the form below to add one !'}
          </td>
        </tr>
      );
    }

    return (
      <div className="repositories">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>URL</th>
                <th>Last commit</th>
                <th>Message</th>
                <th>Author</th>
                <th><span className="sr-only">Remove</span></th>
              </tr>
            </thead>
            <tbody>
              {tableLines}
            </tbody>
          </table>
        </div>
        <RepositoryForm onNewRepo={this.handleNewRepo} />
      </div>
    );
  }
});

ReactDOM.render(
  <RepositoryTable />,
  document.getElementById('app')
);