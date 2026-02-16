# Task: gen-ll-reverse_list-1239 | Score: 100% | 2026-02-12T19:21:41.063606

n = int(input())
l = []
for _ in range(n):
  l.append(input())

l.reverse()
print(*l)