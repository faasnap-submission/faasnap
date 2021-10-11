# FaaSnap
The daemon is in `faasnap`. 

The customized Firecracker is in `firecracker`. We modified `src/vmm/src/vmm_config/snapshot.rs`, `src/vmm/src/persist.rs`, and `src/vmm/src/memory_snapshot.rs`.

# Setup
1. Build Firecracker:
    - `cd firecracker`
    - `tools/devtool build`
    - The built executable is in `build/cargo_target/x86_64-unknown-linux-musl/debug/firecracker`
2. See faasnap/README.md
