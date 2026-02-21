FROM kalilinux/kali-rolling

ARG KALI_METAPACKAGE=kali-linux-large
ENV DEBIAN_FRONTEND=noninteractive

# Note: "kali-linux-everything" is HUGE. Default is "kali-linux-large".
RUN apt-get update -qq \
  && apt-get install -y -qq --no-install-recommends \
    ca-certificates \
    curl \
    git \
    bash \
    sudo \
    python3 \
    python3-pip \
    jq \
    ${KALI_METAPACKAGE} \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Create frankenstein user with full sudo (no password)
RUN useradd -m -s /bin/bash frankenstein \
  && echo "frankenstein ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/frankenstein \
  && chmod 0440 /etc/sudoers.d/frankenstein \
  && usermod -aG sudo frankenstein

# Also ensure root has passwordless sudo
RUN echo "root ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/root

CMD ["bash", "-lc", "sleep infinity"]
