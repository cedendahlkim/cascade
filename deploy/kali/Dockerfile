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
    ${KALI_METAPACKAGE} \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

CMD ["bash", "-lc", "sleep infinity"]
