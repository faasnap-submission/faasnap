#!/usr/bin/env bash

set -xeu

FS_USER="${USER:-ubuntu}"
IFACE="$(route | grep '^default' | grep -o '[^ ]*$')"

sudo setfacl -m u:${USER}:rw /dev/kvm

# network
sudo sh -c "echo 1 > /proc/sys/net/ipv4/ip_forward"
sudo iptables -t nat -A POSTROUTING -o "${IFACE}" -j MASQUERADE
sudo iptables -A FORWARD -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT

# FS image
if [[ ! -f "rootfs/debian-rootfs.ext4" ]]; then
  pushd rootfs
  make debian-rootfs.ext4
  popd
fi

docker run -d -p 9411:9411 openzipkin/zipkin

for i in {1..100}; do sudo ./network.sh $i ;done
