# FaaSnap daemon
- The daemon is mostly implemented in `./daemon`
- The main function is in `./cmd/snapfaas-server/main.go`
- The API is defined in `./api` and implemented in `./restapi` and generated `./models`.
- The rootfs image is in `./rootfs`.

# Setup
1. Build API. `go swagger generate server -f api/swagger.yaml`.
1. Compile the daemon. `go get -u ./... && go build cmd/snapfaas-server/main.go`
2. Build rootfs image. `cd rootfs && make debian-rootfs.ext4 && cd -`
3. Redis:
    - Start a local Redis instance on the default port 6379.
    - Populate Redis with files in `resources` directory. Keys should be the last parts of filenames (`basename`).
4. Configure `test.json`:
    - `home_dir` is current directory
    - `test_dir` is the where snapshots should be located
    - `snapfaas.executables.vanilla` and `uffd` both are the path to the built Firecracker executable
5. Copy files into test_dir, including:
    - kernels: *.vmlinux.bin
    - images: rootfs/debian-rootfs.ext4
6. Run `prep.sh`
7. Run tests:
    - `sudo ./tests.py tests.json`
    - go to http://your-ip:9411, use traceIDs to find trace results.
