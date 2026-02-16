# Task: gen-ll-reverse_list-4685 | Score: 100% | 2026-02-12T14:04:21.990980

n = int(input())
l = []
for _ in range(n):
  l.append(input())

print(' '.join(l[::-1]))