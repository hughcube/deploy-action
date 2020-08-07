<h1 align="center">Deploy Actions</h1>


<p>
    <a href="https://github.com/hughcube/deploy-action/actions?query=workflow%3ATest">
        <img src="https://github.com/hughcube/deploy-action/workflows/Test/badge.svg" alt="Test Actions status">
    </a>
    <a href="https://github.com/hughcube/deploy-action/blob/master/LICENSE">
        <img src="https://img.shields.io/badge/license-MIT-428f7e.svg" alt="License">
    </a>
</p>

## Usage

```yaml
steps:
    - uses: actions/checkout@v1
    - uses: hughcube/deploy-action@v1.0.0
      with:
        ssh_private_key: ${{ secrets.SSH_PRIVATE_KEY }}
    - run: 
        rsync --version
        ssh ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} "date"
```

Use `aliyun.exe` if job runs on Windows.

## License

MIT
